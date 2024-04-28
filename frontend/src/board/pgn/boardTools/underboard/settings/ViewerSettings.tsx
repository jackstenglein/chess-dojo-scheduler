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

export const PerspectiveModeKey = 'perspectiveMode';
export const GoToEndButtonBehaviorKey = 'goToEndBehavior';
export const VariationBehaviorKey = 'variationBehavior';
export const ShowMoveTimesInPgnKey = 'showMoveTimesInPgn';
export const CapturedMaterialBehaviorKey = 'capturedMaterialBehavior';

export enum PerspectiveMode {
    TwoD = 'TWO_D',
    ThreeD = 'THREE_D',
}

export enum GoToEndButtonBehavior {
    SingleClick = 'SINGLE_CLICK',
    DoubleClick = 'DOUBLE_CLICK',
    Hidden = 'HIDDEN',
}

export enum VariationBehavior {
    None = 'NONE',
    Dialog = 'DIALOG',
}

export enum CapturedMaterialBehavior {
    None = 'NONE',
    Difference = 'DIFFERENCE',
    All = 'ALL',
}

const ViewerSettings = () => {
    const [perspectiveMode, setPerpsectiveMode] = useLocalStorage<string>(
        PerspectiveModeKey,
        PerspectiveMode.TwoD,
    );
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
    const [capturedMaterialBehavior, setCapturedMaterialBehavior] =
        useLocalStorage<string>(
            CapturedMaterialBehaviorKey,
            CapturedMaterialBehavior.Difference,
        );

    return (
        <Stack spacing={3}>
            <Typography variant='h5'>Viewer Settings</Typography>

            <TextField
                select
                label='Board Perspective'
                value={perspectiveMode}
                onChange={(e) => setPerpsectiveMode(e.target.value)}
            >
                <MenuItem value={PerspectiveMode.TwoD}>Two Dimensional</MenuItem>
                <MenuItem value={PerspectiveMode.ThreeD}>Three Dimensional</MenuItem>
            </TextField>

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

            <TextField
                select
                label='Captured Material Display'
                value={capturedMaterialBehavior}
                onChange={(e) => setCapturedMaterialBehavior(e.target.value)}
            >
                <MenuItem value={CapturedMaterialBehavior.None}>None</MenuItem>
                <MenuItem value={CapturedMaterialBehavior.Difference}>
                    Show Difference Only
                </MenuItem>
                <MenuItem value={CapturedMaterialBehavior.All}>
                    Show All Captured Material
                </MenuItem>
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
            </Stack>

            <KeyboardShortcuts />
        </Stack>
    );
};

export default ViewerSettings;
