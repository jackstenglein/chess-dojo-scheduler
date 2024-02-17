import { MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useLocalStorage } from 'usehooks-ts';

export const GoToEndButtonBehaviorKey = 'goToEndBehavior';

export enum GoToEndButtonBehavior {
    SingleClick = 'SINGLE_CLICK',
    DoubleClick = 'DOUBLE_CLICK',
    Hidden = 'HIDDEN',
}

interface ViewerSettingsProps {
    showTitle?: boolean;
}

const ViewerSettings: React.FC<ViewerSettingsProps> = ({ showTitle }) => {
    const [goToEndBehavior, setGoToEndBehavior] = useLocalStorage<string>(
        GoToEndButtonBehaviorKey,
        GoToEndButtonBehavior.SingleClick,
    );

    return (
        <Stack spacing={3} pt={showTitle ? undefined : 1}>
            {showTitle && <Typography variant='h5'>Viewer Settings</Typography>}

            <TextField
                select
                label='Go to Start/End Button Behavior'
                value={goToEndBehavior}
                onChange={(e) => setGoToEndBehavior(e.target.value)}
            >
                <MenuItem value={GoToEndButtonBehavior.SingleClick}>
                    Single Click
                </MenuItem>
                <MenuItem value={GoToEndButtonBehavior.DoubleClick}>
                    Double Click
                </MenuItem>
                <MenuItem value={GoToEndButtonBehavior.Hidden}>Hidden</MenuItem>
            </TextField>
        </Stack>
    );
};

export default ViewerSettings;
