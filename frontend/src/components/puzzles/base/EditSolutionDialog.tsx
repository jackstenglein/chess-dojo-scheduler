'use client';

import { DefaultUnderboardTab } from '@/board/pgn/boardTools/underboard/underboardTabs';
import PgnBoard, { PgnBoardApi } from '@/board/pgn/PgnBoard';
import { GameContext } from '@/context/useGame';
import { Help } from '@mui/icons-material';
import { AppBar, Button, Dialog, Stack, Toolbar, Typography } from '@mui/material';
import { useRef } from 'react';
import { PUZZLE_COORDINATE_SIZE } from '../settings/puzzleSettingsKeys';
import { buildPuzzlePgn, splitPuzzlePgn } from './editPuzzle';
import { MarkerHelp } from './PgnGuide';
import { SolutionMarkerMenuItems } from './SolutionMarkerMenuItems';

interface EditSolutionDialogProps {
    /** The puzzle's number, for the title. */
    puzzleId: string;
    /** The starting position. */
    fen: string;
    /** The solution's moves, variations and comments. */
    movetext: string;
    /** The puzzle's other headers, which are kept. */
    headers: [string, string][];
    onClose: () => void;
    /** Called with the edited movetext when the contributor applies their changes. */
    onApply: (movetext: string) => void;
}

const markerTab = {
    name: 'Markers',
    tooltip: 'ALT, ALT2 and SKIP',
    icon: <Help />,
    element: <MarkerHelp />,
};

/**
 * Edits a puzzle's solution on a board, with the same tools as the analysis board: play moves,
 * add variations, set symbols and evaluations, and write comments. Right-click the first move of
 * a variation to mark it ALT, ALT2 or SKIP.
 */
export function EditSolutionDialog({
    puzzleId,
    fen,
    movetext,
    headers,
    onClose,
    onApply,
}: EditSolutionDialogProps) {
    const board = useRef<PgnBoardApi>(null);
    const blackToMove = fen.split(' ')[1] === 'b';

    const apply = () => {
        const pgn = board.current?.getPgn() ?? '';
        onApply(splitPuzzlePgn(pgn).movetext);
        onClose();
    };

    return (
        <Dialog open fullScreen onClose={onClose}>
            <AppBar
                position='static'
                color='default'
                elevation={0}
                sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
                <Toolbar sx={{ gap: 2 }}>
                    <Typography sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                        Edit solution for puzzle #{puzzleId}
                    </Typography>
                    <Button color='inherit' onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant='contained' onClick={apply}>
                        Apply
                    </Button>
                </Toolbar>
            </AppBar>

            <Stack sx={{ p: 2, flexGrow: 1, minHeight: 0, overflow: 'auto' }}>
                <GameContext.Provider value={{ isOwner: true, unsaved: true }}>
                    <PgnBoard
                        ref={board}
                        pgn={buildPuzzlePgn(fen, headers, movetext)}
                        showPlayerHeaders={false}
                        startOrientation={blackToMove ? 'black' : 'white'}
                        underboardTabs={[
                            DefaultUnderboardTab.Editor,
                            markerTab,
                            DefaultUnderboardTab.Settings,
                        ]}
                        initialUnderboardTab={DefaultUnderboardTab.Editor}
                        rightTabs={[DefaultUnderboardTab.PgnText]}
                        initialRightTab={DefaultUnderboardTab.PgnText}
                        tabStorageKeyPrefix='puzzle-solution-editor'
                        allowMoveDeletion
                        allowDeleteBefore
                        disableNullMoves={false}
                        slots={{ moveMenuItems: SolutionMarkerMenuItems }}
                        slotProps={{ board: { defaultCoordinateSize: PUZZLE_COORDINATE_SIZE } }}
                    />
                </GameContext.Provider>
            </Stack>
        </Dialog>
    );
}
