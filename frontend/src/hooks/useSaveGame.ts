'use client';

import { EventType, trackEvent } from '@/analytics/events';
import { useApi } from '@/api/Api';
import { EditGameResponse, isGame } from '@/api/gameApi';
import { Request, useRequest } from '@/api/Request';
import useGame from '@/context/useGame';
import { Game } from '@/database/game';
import {
    CreateGameRequest,
    UpdateGameRequest,
} from '@jackstenglein/chess-dojo-common/src/database/game';
import { useSessionStorage } from 'usehooks-ts';

const STAGED_CREATE_GAME_KEY = 'useSaveGame:stageCreateGame';

export interface UseSaveGameFields {
    createGame: (req: CreateGameRequest) => Promise<void>;
    updateGame: (req: UpdateGameRequest) => Promise<void>;
    stageCreateGame: (req: CreateGameRequest) => void;
    stagedCreateGame: CreateGameRequest | null;
    request: Request<string>;
}

export default function useSaveGame(): UseSaveGameFields {
    const api = useApi();
    const request = useRequest<string>();
    const [stagedCreateGame, stageCreateGame] =
        useSessionStorage<CreateGameRequest | null>(STAGED_CREATE_GAME_KEY, null);
    const { game } = useGame();

    const createGame = async (createReq: CreateGameRequest) => {
        request.onStart();
        let data: Game | EditGameResponse | undefined;
        try {
            const response = await api.createGame(createReq);
            data = response.data;
        } catch (err) {
            console.error('CreateGame ', err);
            request.onFailure(err);
        }

        if (!data) {
            return;
        }

        onCreateGame(createReq, data);

        if (isGame(data)) {
            request.onSuccess();
        } else {
            request.onSuccess(`Created ${data.count} games`);
        }
    };

    const updateGame = async (updateReq: UpdateGameRequest) => {
        if (!game) {
            return;
        }

        request.onStart();
        let data: Game | EditGameResponse | undefined;
        try {
            const response = await api.updateGame(game.cohort, game.id, updateReq);
            data = response.data;
        } catch (err) {
            console.error('updateGame ', err);
            request.onFailure(err);
        }

        if (!data) {
            return;
        }

        request.onSuccess();
    };

    return {
        stagedCreateGame,
        stageCreateGame,
        createGame,
        updateGame,
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
            newUrl += `?directory=${req.directory.id}&directoryOwner=${req.directory.owner}`;
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
