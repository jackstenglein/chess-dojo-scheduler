'use client';

import { useApi } from '@/api/Api';
import { useRequest } from '@/api/Request';
import { DefaultUnderboardTab } from '@/board/pgn/boardTools/underboard/Underboard';
import PgnBoard from '@/board/pgn/PgnBoard';
import { Game } from '@/database/game';
import { GameContext } from '@/hooks/useGame';
import { useEffect } from 'react';

export const GameViewer = ({ cohort, id }: { cohort: string; id: string }) => {
    const api = useApi();
    const request = useRequest<Game>();

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.getGame(cohort, id)
                .then((response) => request.onSuccess(response.data))
                .catch((err) => {
                    console.error('Failed to get game: ', err);
                    request.onFailure(err);
                });
        }
    }, [cohort, id, api, request]);

    if (!request.data?.pgn) {
        return null;
    }

    return (
        <GameContext.Provider
            value={{
                game: request.data,
                onUpdateGame: request.onSuccess,
                isOwner: false,
            }}
        >
            <PgnBoard
                pgn={request.data.pgn}
                startOrientation={request.data.orientation}
                underboardTabs={[
                    DefaultUnderboardTab.Tags,
                    DefaultUnderboardTab.Comments,
                    DefaultUnderboardTab.Explorer,
                    DefaultUnderboardTab.Clocks,
                ]}
            />
        </GameContext.Provider>
    );
};
