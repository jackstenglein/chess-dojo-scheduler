'use client';

import { DefaultUnderboardTab } from '@/board/pgn/boardTools/underboard/Underboard';
import PgnBoard from '@/board/pgn/PgnBoard';
import { EngineMoveButtonExtras } from '@/components/games/view/EngineMoveButtonExtras';
import { GameContext } from '@/context/useGame';
import PgnErrorBoundary from '@/games/view/PgnErrorBoundary';
import useSaveGame from '@/hooks/useSaveGame';
import { CreateGameRequest } from '@jackstenglein/chess-dojo-common/src/database/game';

const FEN_STARTING = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function parseCreateGameRequest(req: CreateGameRequest | null) {
    if (!req) {
        return { fen: FEN_STARTING };
    }

    if (req.pgnText) {
        return { pgn: req.pgnText };
    }

    if (req.type === 'startingPosition') {
        return { fen: FEN_STARTING };
    }

    return { pgn: '1. a3 h6' };
}

export default function AnalysisBoard() {
    const { stagedCreateGame } = useSaveGame();

    const { pgn, fen } = parseCreateGameRequest(stagedCreateGame);

    return (
        <PgnErrorBoundary pgn={pgn}>
            <GameContext.Provider
                value={{
                    isOwner: true,
                    unsaved: true,
                }}
            >
                <PgnBoard
                    pgn={pgn}
                    fen={fen}
                    startOrientation='white'
                    underboardTabs={[
                        DefaultUnderboardTab.Tags,
                        DefaultUnderboardTab.Editor,
                        DefaultUnderboardTab.Comments,
                        DefaultUnderboardTab.Explorer,
                        DefaultUnderboardTab.Clocks,
                        DefaultUnderboardTab.Settings,
                    ]}
                    allowMoveDeletion={true}
                    slots={{
                        moveButtonExtras: EngineMoveButtonExtras,
                    }}
                />
            </GameContext.Provider>
        </PgnErrorBoundary>
    );
}
