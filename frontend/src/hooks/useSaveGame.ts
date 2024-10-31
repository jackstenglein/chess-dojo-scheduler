import { EventType, trackEvent } from '@/analytics/events';
import { useApi } from '@/api/Api';
import { BoardOrientation, GameSubmissionType, UpdateGameRequest } from '@/api/gameApi';
import { useRequest } from '@/api/Request';
import { useChess } from '@/board/pgn/PgnBoard';
import { Game, PgnHeaders } from '@/database/game';

export interface SaveGameDetails {
    headers: PgnHeaders;
    orientation: BoardOrientation;
    isPublishing?: boolean;
}

export default function useSaveGame({
    game,
    onSaveGame,
}: {
    game: Game;
    onSaveGame?: (game: Game) => void;
}) {
    const { chess } = useChess();
    const api = useApi();
    const request = useRequest();

    const saveGame = ({
        headers,
        isPublishing,
    }: SaveGameDetails & { isPublishing?: boolean }) => {
        request.onStart();

        const update: UpdateGameRequest = {
            timelineId: game.timelineId,
            headers: {
                white: headers.White,
                black: headers.Black,
                date: headers.Date,
                result: headers.Result,
            },
        };

        // Presence of unlisted field signals whether to
        // queue publishing/unlisting workflow.
        if (isPublishing) {
            update.unlisted = false;
        } else if (!game.unlisted) {
            update.unlisted = true;
        }

        for (const [name, value] of Object.entries(headers)) {
            chess?.setHeader(name, value);
        }

        update.type = GameSubmissionType.Editor;
        update.pgnText = chess?.renderPgn();

        api.updateGame(game.cohort, game.id, update)
            .then((resp) => {
                trackEvent(EventType.UpdateGame, {
                    method: 'settings',
                    dojo_cohort: game.cohort,
                });

                request.onSuccess();
                onSaveGame?.(resp.data);
            })
            .catch((err) => {
                console.error('updateGame: ', err);
                request.onFailure(err);
            });
    };

    return { request, saveGame };
}
