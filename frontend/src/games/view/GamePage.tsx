import { Chess, Move } from '@jackstenglein/chess';
import { Computer } from '@mui/icons-material';
import { Box, Tooltip } from '@mui/material';
import { createContext, useContext, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { EventType, trackEvent } from '../../analytics/events';
import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import {
    BoardOrientation,
    GameHeader,
    GameSubmissionType,
    UpdateGameRequest,
    isMissingData,
} from '../../api/gameApi';
import { useAuth } from '../../auth/Auth';
import PgnBoard from '../../board/pgn/PgnBoard';
import { DefaultUnderboardTab } from '../../board/pgn/boardTools/underboard/Underboard';
import { Game } from '../../database/game';
import { MissingGameDataPreflight } from '../edit/MissingGameDataPreflight';
import PgnErrorBoundary from './PgnErrorBoundary';

interface GameContextType {
    game?: Game;
    onUpdateGame?: (g: Game) => void;
    isOwner?: boolean;
}

const GameContext = createContext<GameContextType>({});

export function useGame() {
    return useContext(GameContext);
}

const GamePage = () => {
    const api = useApi();
    const request = useRequest<Game>();
    const featureRequest = useRequest();
    const updateRequest = useRequest<Game>();
    const { cohort, id } = useParams();
    const user = useAuth().user;
    const [searchParams, setSearchParams] = useSearchParams({ firstLoad: 'false' });
    const firstLoad = searchParams.get('firstLoad') === 'true';

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
                    const game = response.data;
                    request.onSuccess(game);
                })
                .catch((err) => {
                    console.error('Failed to get game: ', err);
                    request.onFailure(err);
                });
        }
    }, [request, api, cohort, id]);

    const onSave = (headers: GameHeader, orientation: BoardOrientation) => {
        const game = request.data;

        if (game === undefined) {
            console.error('Game is unexpectedly undefined');
            return;
        }

        updateRequest.onStart();

        const chess = new Chess();
        chess.loadPgn(game.pgn);
        const headerMap = {
            White: headers.white,
            Black: headers.black,
            Date: headers.date,
            Result: headers.result,
        };

        for (const [name, value] of Object.entries(headerMap)) {
            if (value) {
                chess.setHeader(name, value);
            }
        }

        const update: UpdateGameRequest = {
            headers,
            unlisted: true,
            orientation,
            type: GameSubmissionType.Editor,
            pgnText: chess.renderPgn(),
        };

        api.updateGame(game.cohort, game.id, update)
            .then((resp) => {
                trackEvent(EventType.UpdateGame, {
                    method: 'preflight',
                    dojo_cohort: game.cohort,
                });

                const updatedGame = resp.data;
                request.onSuccess(updatedGame);
                updateRequest.onSuccess(updatedGame);
                setSearchParams();
            })
            .catch((err) => {
                console.error('updateGame: ', err);
                updateRequest.onFailure(err);
            });
    };

    const isOwner = request.data?.owner === user?.username;
    const showPreflight =
        isOwner && firstLoad && request.data !== undefined && isMissingData(request.data);

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
            <RequestSnackbar request={updateRequest} />

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
                            ...(user ? [DefaultUnderboardTab.Directories] : []),
                            DefaultUnderboardTab.Tags,
                            ...(isOwner ? [DefaultUnderboardTab.Editor] : []),
                            DefaultUnderboardTab.Comments,
                            DefaultUnderboardTab.Explorer,
                            DefaultUnderboardTab.Clocks,
                            DefaultUnderboardTab.Settings,
                        ]}
                        allowMoveDeletion={request.data?.owner === user?.username}
                        slots={{
                            moveButtonExtras: EngineMoveButtonExtras,
                        }}
                    />
                </GameContext.Provider>
            </PgnErrorBoundary>
            {request.data && (
                <MissingGameDataPreflight
                    skippable
                    open={showPreflight}
                    initHeaders={request.data.headers}
                    initOrientation={request.data.orientation}
                    loading={updateRequest.isLoading()}
                    onSubmit={onSave}
                    onClose={() => setSearchParams()}
                >
                    You can fill this data out now or later in settings.
                </MissingGameDataPreflight>
            )}
        </Box>
    );
};

export default GamePage;

const EngineMoveButtonExtras = ({ move }: { move: Move }) => {
    if (move.commentDiag?.dojoEngine) {
        return (
            <Tooltip title='This move was found with the engine.'>
                <Computer fontSize='small' sx={{ ml: 0.5 }} color='error' />
            </Tooltip>
        );
    }

    return null;
};
