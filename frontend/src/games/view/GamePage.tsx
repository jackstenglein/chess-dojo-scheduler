import { Box } from '@mui/material';
import { createContext, useContext, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import PgnBoard from '../../board/pgn/PgnBoard';
import { Game } from '../../database/game';
import PgnErrorBoundary from './PgnErrorBoundary';

type GameContextType = {
    game?: Game;
    onUpdateGame?: (g: Game) => void;
};

const GameContext = createContext<GameContextType>({});

export function useGame() {
    return useContext(GameContext);
}

const GamePage = () => {
    const api = useApi();
    const request = useRequest<Game>();
    const featureRequest = useRequest();
    const { cohort, id } = useParams();

    const reset = request.reset;
    useEffect(() => {
        if (cohort && id) {
            reset();
        }
    }, [cohort, id, reset]);

    useEffect(() => {
        if (!request.isSent() && cohort && id) {
            request.onStart();
            api.getGame(cohort, id)
                .then((response) => {
                    request.onSuccess(response.data);
                })
                .catch((err) => {
                    console.error('Failed to get game: ', err);
                    request.onFailure(err);
                });
        }
    }, [request, api, cohort, id]);

    return (
        <Box
            sx={{
                pt: 4,
                pb: 4,
                px: 0,
            }}
        >
            <RequestSnackbar request={request} />
            <RequestSnackbar request={featureRequest} showSuccess />

            <PgnErrorBoundary pgn={request.data?.pgn} game={request.data}>
                <GameContext.Provider
                    value={{
                        game: request.data,
                        onUpdateGame: request.onSuccess,
                    }}
                >
                    <PgnBoard
                        showTags
                        showEditor
                        pgn={request.data?.pgn}
                        startOrientation={request.data?.orientation}
                    />
                </GameContext.Provider>
            </PgnErrorBoundary>
        </Box>
    );
};

export default GamePage;
