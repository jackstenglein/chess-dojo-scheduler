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
import { FEN } from '@jackstenglein/chess';
import {
    CreateGameRequest,
    GameOrientation,
    GameOrientations,
} from '@jackstenglein/chess-dojo-common/src/database/game';

function parseCreateGameRequest(req: CreateGameRequest | null) {
    if (req?.pgnText) {
        return { pgn: req.pgnText };
    }
    return { fen: FEN.start };
}

export default function AnalysisBoard() {
    const { stagedGame } = useSaveGame();

    const { pgn, fen } = parseCreateGameRequest(stagedGame);
    const { user, status } = useAuth();

    if (status === AuthStatus.Loading) {
        return <LoadingPage />;
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
                    fen={fen}
                    startOrientation={getDefaultOrientation(pgn, user)}
                    underboardTabs={[
                        DefaultUnderboardTab.Tags,
                        DefaultUnderboardTab.Editor,
                        DefaultUnderboardTab.Explorer,
                        DefaultUnderboardTab.Clocks,
                        DefaultUnderboardTab.Settings,
                    ]}
                    allowMoveDeletion={true}
                    allowDeleteBefore={true}
                    showElapsedMoveTimes
                    slots={{
                        moveButtonExtras: EngineMoveButtonExtras,
                    }}
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
