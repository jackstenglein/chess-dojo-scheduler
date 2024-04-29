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

export const BoardStyleKey = 'boardStyle';
export const PieceStyleKey = 'pieceStyle';
export const GoToEndButtonBehaviorKey = 'goToEndBehavior';
export const VariationBehaviorKey = 'variationBehavior';
export const ShowMoveTimesInPgnKey = 'showMoveTimesInPgn';
export const CapturedMaterialBehaviorKey = 'capturedMaterialBehavior';

export enum BoardStyle {
    Standard = 'STANDARD',
}

export enum PieceStyle {
    Standard = 'STANDARD',
    Pixel = 'PIXEL',
    Wood = 'WOOD',
    Celtic = 'CELTIC',
    Fantasy = 'FANTASY',
    Cherry = 'CHERRY',
    Walnut = 'WALNUT',
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
    const [boardStyle, setBoardStyle] = useLocalStorage<string>(
        BoardStyleKey,
        BoardStyle.Standard,
    );
    const [pieceStyle, setPieceStyle] = useLocalStorage<string>(
        PieceStyleKey,
        PieceStyle.Standard,
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
                label='Board Style'
                value={boardStyle}
                onChange={(e) => setBoardStyle(e.target.value)}
            >
                <MenuItem value={BoardStyle.Standard}>Standard</MenuItem>
            </TextField>

            <TextField
                select
                label='Piece Style'
                value={pieceStyle}
                onChange={(e) => setPieceStyle(e.target.value)}
            >
                <MenuItem value={PieceStyle.Standard}>Standard</MenuItem>
                <MenuItem value={PieceStyle.Pixel}>Pixel Night</MenuItem>
                <MenuItem value={PieceStyle.Wood}>Wood Park</MenuItem>
                <MenuItem value={PieceStyle.Walnut}>Walnut Castle</MenuItem>
                <MenuItem value={PieceStyle.Celtic}>Summer Time</MenuItem>
                <MenuItem value={PieceStyle.Fantasy}>Moon Light</MenuItem>
                <MenuItem value={PieceStyle.Cherry}>Cherry Blossom</MenuItem>
                <MenuItem value={PieceStyle.ThreeD}>Three Dimensional</MenuItem>
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
