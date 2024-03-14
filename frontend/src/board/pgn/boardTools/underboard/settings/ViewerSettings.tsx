import {
    Checkbox,
    FormControlLabel,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useLocalStorage } from 'usehooks-ts';
import KeyboardShortcuts from './KeyboardShortcuts';

export const GoToEndButtonBehaviorKey = 'goToEndBehavior';
export const VariationBehaviorKey = 'variationBehavior';
export const ShowMoveTimesInPgnKey = 'showMoveTimesInPgn';
export const ShowCapturedMaterialKey = 'showCapturedMaterial';

export enum GoToEndButtonBehavior {
    SingleClick = 'SINGLE_CLICK',
    DoubleClick = 'DOUBLE_CLICK',
    Hidden = 'HIDDEN',
}

export enum VariationBehavior {
    None = 'NONE',
    Dialog = 'DIALOG',
}

const ViewerSettings = () => {
    const [goToEndBehavior, setGoToEndBehavior] = useLocalStorage<string>(
        GoToEndButtonBehaviorKey,
        GoToEndButtonBehavior.SingleClick,
    );
    const [variationBehavior, setVariationBehavior] = useLocalStorage<string>(
        VariationBehaviorKey,
        VariationBehavior.None,
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
        <Stack spacing={3}>
            <Typography variant='h5'>Viewer Settings</Typography>

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

            <TextField
                select
                label='Variation Behavior'
                value={variationBehavior}
                onChange={(e) => setVariationBehavior(e.target.value)}
            >
                <MenuItem value={VariationBehavior.None}>None</MenuItem>
                <MenuItem value={VariationBehavior.Dialog}>Prompt in Dialog</MenuItem>
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

            <KeyboardShortcuts />
        </Stack>
    );
};

export default ViewerSettings;
