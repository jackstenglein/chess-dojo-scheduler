import { FormHelperText, ListItemIcon, ListItemText, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { SxProps, Theme, useTheme } from '@mui/material/styles';

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
            !selected.includes(value)
                ? theme.typography.fontWeightRegular
                : theme.typography.fontWeightMedium,
    };
}

export interface MultipleSelectChipOption {
    value: string;
    label: string;
    icon?: JSX.Element;
}

interface MultipleSelectChipProps {
    selected: string[];
    setSelected: (v: string[]) => void;
    options: MultipleSelectChipOption[];
    label?: string;
    size?: 'small' | 'medium';
    sx?: SxProps;
    error?: boolean;
    errorHelper?: string;
    'data-cy'?: string;
    displayEmpty?: string;
}

export default function MultipleSelectChip({
    selected,
    setSelected,
    options,
    label,
    size,
    sx,
    error,
    errorHelper,
    displayEmpty,
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
        <FormControl {...others} sx={sx} error={error || Boolean(errorHelper)}>
            {label && <InputLabel>{label}</InputLabel>}
            <Select
                multiple
                value={selected}
                onChange={handleChange}
                input={<OutlinedInput label={label} />}
                renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                            <Chip
                                key={value}
                                label={options.find((o) => o.value === value)?.label}
                                size={size}
                            />
                        ))}
                        {selected.length === 0 && !!displayEmpty && (
                            <Typography color='text.secondary' fontStyle='italic'>
                                {displayEmpty}
                            </Typography>
                        )}
                    </Box>
                )}
                MenuProps={MenuProps}
                displayEmpty={!!displayEmpty}
            >
                {options.map((option) => (
                    <MenuItem
                        key={option.value}
                        value={option.value}
                        style={getStyles(option.value, selected, theme)}
                    >
                        <ListItemIcon>{option.icon}</ListItemIcon>
                        <ListItemText>{option.label}</ListItemText>
                    </MenuItem>
                ))}
            </Select>
            {errorHelper && <FormHelperText>{errorHelper}</FormHelperText>}
        </FormControl>
    );
}
