'use client';

import { DefaultUnderboardTab } from '@/board/pgn/boardTools/underboard/Underboard';
import PgnBoard from '@/board/pgn/PgnBoard';
import { EngineMoveButtonExtras } from '@/components/games/view/EngineMoveButtonExtras';
import { GameContext } from '@/context/useGame';
import PgnErrorBoundary from '@/games/view/PgnErrorBoundary';
import { Box } from '@mui/material';

export default function Page() {
    const gameData = undefined;
    const pgn = '1. e4 e5';
    const onUpdateGame = undefined;
    const isOwner = true;
    const gameOrientation = 'white';
    const user = undefined;
    const allowMoveDeletion = true;
    const unsaved = true;

    return (
        <Box
            sx={{
                pt: 4,
                pb: 4,
                px: 0,
            }}
        >
            <PgnErrorBoundary pgn={pgn} game={gameData}>
                <GameContext.Provider
                    value={{
                        game: gameData,
                        unsaved,
                        onUpdateGame,
                        isOwner,
                    }}
                >
                    <PgnBoard
                        pgn={pgn}
                        startOrientation={gameOrientation}
                        underboardTabs={[
                            ...(user ? [DefaultUnderboardTab.Directories] : []),
                            DefaultUnderboardTab.Tags,
                            ...(isOwner ? [DefaultUnderboardTab.Editor] : []),
                            DefaultUnderboardTab.Comments,
                            DefaultUnderboardTab.Explorer,
                            DefaultUnderboardTab.Clocks,
                            DefaultUnderboardTab.Settings,
                        ]}
                        allowMoveDeletion={allowMoveDeletion}
                        slots={{
                            moveButtonExtras: EngineMoveButtonExtras,
                        }}
                    />
                </GameContext.Provider>
            </PgnErrorBoundary>
        </Box>
    );
}
