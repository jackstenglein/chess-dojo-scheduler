'use client';

import { EventType, trackEvent } from '@/analytics/events';
import { useApi } from '@/api/Api';
import { EditGameResponse, isGame } from '@/api/gameApi';
import { Request, useRequest } from '@/api/Request';
import { Game } from '@/database/game';
import { CreateGameRequest } from '@jackstenglein/chess-dojo-common/src/database/game';
import { useSessionStorage } from 'usehooks-ts';

const STAGED_CREATE_GAME_KEY = 'useSaveGame:stageCreateGame';

export interface UseSaveGameFields {
    createGame: (req: CreateGameRequest) => Promise<void>;
    stageCreateGame: (req: CreateGameRequest) => void;
    stagedCreateGame: CreateGameRequest | null;
    request: Request<string>;
}

export default function useSaveGame(): UseSaveGameFields {
    const api = useApi();
    const request = useRequest<string>();
    const [stagedCreateGame, stageCreateGame] =
        useSessionStorage<CreateGameRequest | null>(STAGED_CREATE_GAME_KEY, null);

    const createGame = async (req: CreateGameRequest) => {
        request.onStart();
        let data: Game | EditGameResponse | undefined;
        try {
            const response = await api.createGame(req);
            data = response.data;
        } catch (err) {
            console.error('CreateGame ', err);
            request.onFailure(err);
        }

        if (!data) {
            return;
        }

        onCreateGame(req, data);

        if (!isGame(data)) {
            request.onSuccess(`Created ${data.count} games`);
        }

        request.onSuccess();
    };

    /*
    const saveGame = ({ headers, isPublishing }: SaveGameDetails) => {
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
    */

    return {
        stagedCreateGame,
        stageCreateGame,
        createGame,
        request,
    };
}

function onCreateGame(req: CreateGameRequest, data: Game | EditGameResponse) {
    if (isGame(data)) {
        const game = data;
        trackEvent(EventType.SubmitGame, {
            count: 1,
            method: req.type,
        });

        const urlSafeId = game.id.replaceAll('?', '%3F');
        let newUrl = `/games/${game.cohort.replaceAll('+', '%2B')}/${urlSafeId}`;

        if (req.directory) {
            newUrl += `&directory=${req.directory.id}&directoryOwner=${req.directory.owner}`;
        }

        window.location.href = newUrl;
    } else {
        const count = data.count;
        trackEvent(EventType.SubmitGame, {
            count: count,
            method: req.type,
        });
        window.location.href = '/profile?view=games';
    }
}
