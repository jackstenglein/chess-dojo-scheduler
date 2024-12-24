'use client';

import { AuthStatus, useAuth } from '@/auth/Auth';
import { DefaultUnderboardTab } from '@/board/pgn/boardTools/underboard/underboardTabs';
import PgnBoard from '@/board/pgn/PgnBoard';
import { EngineMoveButtonExtras } from '@/components/games/view/EngineMoveButtonExtras';
import { GameContext } from '@/context/useGame';
import { User } from '@/database/user';
import PgnErrorBoundary from '@/games/view/PgnErrorBoundary';
import useSaveGame from '@/hooks/useSaveGame';
import LoadingPage from '@/loading/LoadingPage';
import { Chess, FEN } from '@jackstenglein/chess';
import {
    CreateGameRequest,
    GameOrientation,
    GameOrientations,
} from '@jackstenglein/chess-dojo-common/src/database/game';
import { Api } from 'chessground/api';
import { EventType as ChessEventType } from '@jackstenglein/chess';
import { usePathname } from 'next/navigation';
import { useNextSearchParams } from '@/hooks/useNextSearchParams';

const startingPositionFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function parseCreateGameRequest(req: CreateGameRequest | null) {
    if (req?.pgnText) {
        return { pgn: req.pgnText };
    }
    return { fen: FEN.start };
}

export default function AnalysisBoard() {
    const { stagedGame } = useSaveGame();
    const { pgn, fen: initialFen } = parseCreateGameRequest(stagedGame);
    const { searchParams } = useNextSearchParams({fen: initialFen ?? startingPositionFen});
    const { user, status } = useAuth();
    const pathname = usePathname();

    if (status === AuthStatus.Loading) {
        return <LoadingPage />;
    }

    const onInitialize = (_: Api, chess: Chess) => {
        const observer = {
            types: [
                ChessEventType.NewVariation,
                ChessEventType.UpdateComment,
                ChessEventType.UpdateCommand,
                ChessEventType.UpdateNags,
                ChessEventType.Initialized,
                ChessEventType.UpdateDrawables,
                ChessEventType.DeleteMove,
                ChessEventType.DeleteBeforeMove,
                ChessEventType.PromoteVariation,
                ChessEventType.UpdateHeader,
                ChessEventType.LegalMove,
            ],
            handler: () => {
                const params = new URLSearchParams(searchParams);
                params.set('fen', chess.fen());

                const url = `${pathname}?${params.toString()}`;
                window.history.replaceState(
                    { ...window.history.state, as: url, url },
                    '',
                    url,
                );
            },
        };

        chess.addObserver(observer);
    }

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
                    fen={searchParams.get("fen") ?? undefined}
                    onInitialize={onInitialize}
                    startOrientation={getDefaultOrientation(pgn, user)}
                    underboardTabs={[
                        DefaultUnderboardTab.Explorer,
                        DefaultUnderboardTab.Tags,
                        DefaultUnderboardTab.Editor,
                        DefaultUnderboardTab.Clocks,
                        DefaultUnderboardTab.Settings,
                    ]}
                    allowMoveDeletion={true}
                    allowDeleteBefore={true}
                    showElapsedMoveTimes
                    slots={{
                        moveButtonExtras: EngineMoveButtonExtras,
                    }}
                    initialUnderboardTab={DefaultUnderboardTab.Explorer}
                />
            </GameContext.Provider>
        </PgnErrorBoundary>
    );
}

/**
 * Gets the default orientation for the given PGN and user. If any of
 * the user's usernames match the Black header in the PGN, black is
 * returned. If not, white is used as the default orientation.
 * @param pgn The PGN to get the default orientation for.
 * @param user The user to get the default orientation for.
 * @returns The default orientation of the game.
 */
function getDefaultOrientation(pgn?: string, user?: User): GameOrientation {
    if (!user || !pgn) {
        return GameOrientations.white;
    }

    const blackRegex = new RegExp(`^\\[Black "(.*)"\\]$`, 'mi');
    const results = blackRegex.exec(pgn);

    if (!results || results.length < 2) {
        return GameOrientations.white;
    }

    const black = results[1].toLowerCase();
    if (user.displayName.toLowerCase() === black) {
        return GameOrientations.black;
    }

    for (const rating of Object.values(user.ratings)) {
        if (rating.username.toLowerCase() === black) {
            return GameOrientations.black;
        }
    }

    return GameOrientations.white;
}
