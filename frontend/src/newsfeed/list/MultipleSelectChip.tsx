import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { SxProps, Theme, useTheme } from '@mui/material/styles';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import IconComponent from '../../profile/progress/IconComponent';
import GraduationIcon from '../../scoreboard/GraduationIcon';
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

function getStyles(value: string, selected: readonly string[], theme: Theme) {
    return {
        fontWeight:
            selected.indexOf(value) === -1
                ? theme.typography.fontWeightRegular
                : theme.typography.fontWeightMedium,
    };
}

interface MultipleSelectChipProps {
    selected: string[];
    setSelected: (v: string[]) => void;
    options: Record<string, string>;
    label: string;
    size?: 'small' | 'medium';
    sx?: SxProps;
    error?: boolean;
    'data-cy'?: string;
}

export default function MultipleSelectChip({
    selected,
    setSelected,
    options,
    label,
    size,
    sx,
    error,
    ...others
}: MultipleSelectChipProps) {
    const theme = useTheme();

    const handleChange = (event: SelectChangeEvent<typeof selected>) => {
        const {
            target: { value },
        } = event;
        setSelected(
            // On autofill we get a stringified value.
            typeof value === 'string' ? value.split(',') : value,
        );
    };

    return (
        <FormControl {...others} sx={sx} error={error}>
            <InputLabel>{label}</InputLabel>
            <Select
                multiple
                value={selected}
                onChange={handleChange}
                input={<OutlinedInput label={label} />}
                renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                            <Chip key={value} label={options[value]} size={size} />
                        ))}
                    </Box>
                )}
                MenuProps={MenuProps}
            >
                {Object.entries(options).map(([v, l]) => (
                    <MenuItem key={v} value={v} style={getStyles(v, selected, theme)}>
                        {/* we take advantage of null values and render the icon or a cohort icon only if label matches the mapping otherwise they disappear! */}
                          <IconComponent iconName={l}/>  <GraduationIcon cohort={l} size={25} sx={{marginRight: '0.6em', verticalAlign: 'middle', }} tooltip=''/>  {l} 
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
