import { Theme, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Chip from '@mui/material/Chip';

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
}

export default function MultipleSelectChip({
    selected,
    setSelected,
    options,
    label,
}: MultipleSelectChipProps) {
    const theme = useTheme();

    const handleChange = (event: SelectChangeEvent<typeof selected>) => {
        const {
            target: { value },
        } = event;
        setSelected(
            // On autofill we get a stringified value.
            typeof value === 'string' ? value.split(',') : value
        );
    };

    return (
        <FormControl>
            <InputLabel>{label}</InputLabel>
            <Select
                multiple
                value={selected}
                onChange={handleChange}
                input={<OutlinedInput label={label} />}
                renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                            <Chip key={value} label={options[value]} />
                        ))}
                    </Box>
                )}
                MenuProps={MenuProps}
            >
                {Object.entries(options).map(([v, l]) => (
                    <MenuItem key={v} value={v} style={getStyles(v, selected, theme)}>
                        {l}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
