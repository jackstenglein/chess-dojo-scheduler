import { MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useLocalStorage } from 'usehooks-ts';

export const ClockFieldFormatKey = 'clockFieldFormat';

export enum ClockFieldFormat {
    SingleField = 'SINGLE_FIELD',
    ThreeField = 'THREE_FIELD',
}

const EditorSettings = () => {
    const [clockFieldFormat, setClockFieldFormat] = useLocalStorage<string>(
        ClockFieldFormatKey,
        ClockFieldFormat.SingleField,
    );

    return (
        <Stack spacing={3}>
            <Typography variant='h5'>Editor Settings</Typography>
            <TextField
                select
                label='Clock Field Format'
                value={clockFieldFormat}
                onChange={(e) => setClockFieldFormat(e.target.value)}
            >
                <MenuItem value={ClockFieldFormat.SingleField}>Single Field</MenuItem>
                <MenuItem value={ClockFieldFormat.ThreeField}>Three Fields</MenuItem>
            </TextField>
        </Stack>
    );
};

export default EditorSettings;
