import {
    Checkbox,
    FormControlLabel,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useLocalStorage } from 'usehooks-ts';

export const GoToEndButtonBehaviorKey = 'goToEndBehavior';
export const ShowMoveTimesInPgnKey = 'showMoveTimesInPgn';
export const ShowCapturedMaterialKey = 'showCapturedMaterial';

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
    const [showMoveTimes, setShowMoveTimes] = useLocalStorage(
        ShowMoveTimesInPgnKey,
        false,
    );
    const [showCapturedMaterial, setShowCapturedMaterial] = useLocalStorage(
        ShowCapturedMaterialKey,
        false,
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

            <Stack>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={showMoveTimes}
                            onChange={(e) => setShowMoveTimes(e.target.checked)}
                        />
                    }
                    label='Show elapsed time next to move'
                />

                <FormControlLabel
                    control={
                        <Checkbox
                            checked={showCapturedMaterial}
                            onChange={(e) => setShowCapturedMaterial(e.target.checked)}
                        />
                    }
                    label='Show captured material next to player names'
                />
            </Stack>
        </Stack>
    );
};

export default ViewerSettings;
