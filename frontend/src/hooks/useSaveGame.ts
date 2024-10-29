import { EventType, trackEvent } from '@/analytics/events';
import { useApi } from '@/api/Api';
import {
    BoardOrientation,
    GameSubmissionType,
    toPgnDate,
    UpdateGameRequest,
} from '@/api/gameApi';
import { useRequest } from '@/api/Request';
import { useChess } from '@/board/pgn/PgnBoard';
import { Game } from '@/database/game';
import { DateTime } from 'luxon';

export interface SaveGameDetails {
    white: string;
    black: string;
    date: DateTime | null;
    result: string;
    orientation: BoardOrientation;
    isPublishing: boolean;
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

    const saveGame = ({ white, black, result, date, isPublishing }: SaveGameDetails) => {
        request.onStart();

        const newHeaders = {
            white: white,
            black: black,
            result: result,
            date: toPgnDate(date) ?? '',
        };

        const update: UpdateGameRequest = {
            timelineId: game.timelineId,
            headers: newHeaders,
        };

        // Presence of unlisted field signals whether to
        // queue publishing/unlisting workflow.
        if (isPublishing) {
            update.unlisted = false;
        } else if (!game.unlisted) {
            update.unlisted = true;
        }

        if (newHeaders) {
            const pgnHeaders = {
                White: newHeaders.white,
                Black: newHeaders.black,
                Date: newHeaders.date || undefined,
            };

            for (const [name, value] of Object.entries(pgnHeaders)) {
                chess?.setHeader(name, value);
            }

            update.headers = newHeaders;
            update.type = GameSubmissionType.Editor;
            update.pgnText = chess?.renderPgn();
        }

        if (newHeaders) {
            const pgnHeaders = {
                White: newHeaders.white,
                Black: newHeaders.black,
                Date: newHeaders.date,
            };

            for (const [name, value] of Object.entries(pgnHeaders)) {
                chess?.setHeader(name, value);
            }

            update.headers = newHeaders;
            update.type = GameSubmissionType.Editor;
            update.pgnText = chess?.renderPgn();
        }

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
