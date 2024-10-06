import { HIGHLIGHT_ENGINE_LINES } from '@/stockfish/engine/engine';
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
export const CoordinateStyleKey = 'coordinateStyle';
export const GoToEndButtonBehaviorKey = 'goToEndBehavior';
export const VariationBehaviorKey = 'variationBehavior2';
export const ShowMoveTimesInPgnKey = 'showMoveTimesInPgn';
export const ShowLegalMovesKey = 'showLegalMoves';
export const CapturedMaterialBehaviorKey = 'capturedMaterialBehavior';
export const ShowGlyphsKey = 'showGlyphsOnBoard';

export enum BoardStyle {
    Standard = 'STANDARD',
    Moon = 'MOON',
    Summer = 'SUMMER',
    Wood = 'WOOD',
    Walnut = 'WALNUT',
    CherryBlossom = 'CHERRY_BLOSSOM',
    Ocean = 'OCEAN',
}

export enum PieceStyle {
    Standard = 'STANDARD',
    Pixel = 'PIXEL',
    Spatial = 'WOOD',
    Celtic = 'CELTIC',
    Fantasy = 'FANTASY',
    Chessnut = 'CHERRY',
    Cburnett = 'WALNUT',
    ThreeD = 'THREE_D',
}

export enum CoordinateStyle {
    None = 'NONE',
    RankFileOnly = 'RANK_FILE',
    AllSquares = 'ALL_SQUARES',
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
    const [coordinateStyle, setCoordinateStyle] = useLocalStorage<CoordinateStyle>(
        CoordinateStyleKey,
        CoordinateStyle.RankFileOnly,
    );
    const [goToEndBehavior, setGoToEndBehavior] = useLocalStorage<string>(
        GoToEndButtonBehaviorKey,
        GoToEndButtonBehavior.SingleClick,
    );
    const [variationBehavior, setVariationBehavior] = useLocalStorage<string>(
        VariationBehaviorKey,
        VariationBehavior.Dialog,
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
    const [showLegalMoves, setShowLegalMoves] = useLocalStorage(ShowLegalMovesKey, true);
    const [showGlyphs, setShowGlyphs] = useLocalStorage(ShowGlyphsKey, false);

    const [highlightEngineLines, setHighlightEngineLines] = useLocalStorage<boolean>(
        HIGHLIGHT_ENGINE_LINES.Key,
        HIGHLIGHT_ENGINE_LINES.Default,
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
                <MenuItem value={BoardStyle.CherryBlossom}>Cherry Blossom</MenuItem>
                <MenuItem value={BoardStyle.Moon}>Moon</MenuItem>
                <MenuItem value={BoardStyle.Ocean}>Ocean</MenuItem>
                <MenuItem value={BoardStyle.Summer}>Summer</MenuItem>
                <MenuItem value={BoardStyle.Walnut}>Walnut</MenuItem>
                <MenuItem value={BoardStyle.Wood}>Wood</MenuItem>
            </TextField>

            <TextField
                select
                label='Piece Style'
                value={pieceStyle}
                onChange={(e) => setPieceStyle(e.target.value)}
            >
                <MenuItem value={PieceStyle.Standard}>Standard</MenuItem>
                <MenuItem value={PieceStyle.Cburnett}>Cburnett</MenuItem>
                <MenuItem value={PieceStyle.Celtic}>Celtic</MenuItem>
                <MenuItem value={PieceStyle.Chessnut}>Chessnut</MenuItem>
                <MenuItem value={PieceStyle.Fantasy}>Fantasy</MenuItem>
                <MenuItem value={PieceStyle.Pixel}>Pixel</MenuItem>
                <MenuItem value={PieceStyle.Spatial}>Spatial</MenuItem>
                <MenuItem value={PieceStyle.ThreeD}>3D</MenuItem>
            </TextField>

            <TextField
                select
                label='Coordinate Style'
                value={coordinateStyle}
                onChange={(e) => setCoordinateStyle(e.target.value as CoordinateStyle)}
            >
                <MenuItem value={CoordinateStyle.None}>None</MenuItem>
                <MenuItem value={CoordinateStyle.RankFileOnly}>
                    Rank and File Only
                </MenuItem>
                <MenuItem value={CoordinateStyle.AllSquares}>Every Square</MenuItem>
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
                            checked={showLegalMoves}
                            onChange={(e) => setShowLegalMoves(e.target.checked)}
                        />
                    }
                    label='Show legal moves'
                />

                <FormControlLabel
                    control={
                        <Checkbox
                            checked={showGlyphs}
                            onChange={(e) => setShowGlyphs(e.target.checked)}
                        />
                    }
                    label='Show glyphs on board'
                />

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
                            checked={highlightEngineLines}
                            onChange={(e) => setHighlightEngineLines(e.target.checked)}
                        />
                    }
                    label='Highlight engine lines in PGN text'
                />
            </Stack>

            <KeyboardShortcuts />
        </Stack>
    );
};

export default ViewerSettings;
