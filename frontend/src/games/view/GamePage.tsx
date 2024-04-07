import { Box } from '@mui/material';
import { createContext, useContext, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { useAuth } from '../../auth/Auth';
import { DefaultUnderboardTab } from '../../board/pgn/boardTools/underboard/Underboard';
import PgnBoard from '../../board/pgn/PgnBoard';
import { Game } from '../../database/game';
import PgnErrorBoundary from './PgnErrorBoundary';

type GameContextType = {
    game?: Game;
    onUpdateGame?: (g: Game) => void;
    isOwner?: boolean;
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
    const user = useAuth().user;

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

    const isOwner = request.data?.owner === user?.username;

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
                        isOwner,
                    }}
                >
                    <PgnBoard
                        pgn={request.data?.pgn}
                        startOrientation={request.data?.orientation}
                        underboardTabs={[
                            DefaultUnderboardTab.Tags,
                            ...(isOwner ? [DefaultUnderboardTab.Editor] : []),
                            DefaultUnderboardTab.Comments,
                            DefaultUnderboardTab.Explorer,
                            DefaultUnderboardTab.Clocks,
                            DefaultUnderboardTab.Settings,
                        ]}
                    />
                </GameContext.Provider>
            </PgnErrorBoundary>
        </Box>
    );
};

export default GamePage;
