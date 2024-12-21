import { EventType, trackEvent } from '@/analytics/events';
import { useApi } from '@/api/Api';
import { isMissingData } from '@/api/gameApi';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { useAuth } from '@/auth/Auth';
import { DefaultUnderboardTab } from '@/board/pgn/boardTools/underboard/underboardTabs';
import PgnBoard from '@/board/pgn/PgnBoard';
import { EngineMoveButtonExtras } from '@/components/games/view/EngineMoveButtonExtras';
import { GameContext } from '@/context/useGame';
import { Game } from '@/database/game';
import { useSearchParams } from '@/hooks/useSearchParams';
import { Chess } from '@jackstenglein/chess';
import {
    GameHeader,
    GameImportTypes,
    GameOrientation,
    UpdateGameRequest,
} from '@jackstenglein/chess-dojo-common/src/database/game';
import { Box } from '@mui/material';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MissingGameDataPreflight } from '../edit/MissingGameDataPreflight';
import PgnErrorBoundary from './PgnErrorBoundary';

const GamePage = () => {
    const api = useApi();
    const request = useRequest<Game>();
    const featureRequest = useRequest();
    const updateRequest = useRequest<Game>();
    const { cohort, id } = useParams();
    const user = useAuth().user;
    const { searchParams, updateSearchParams } = useSearchParams({ firstLoad: 'false' });
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

    const onSave = (headers: GameHeader, orientation: GameOrientation) => {
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
            cohort: game.cohort,
            id: game.id,
            headers,
            unlisted: true,
            orientation,
            type: GameImportTypes.editor,
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
                updateSearchParams({ firstLoad: 'false' });
            })
            .catch((err) => {
                console.error('updateGame: ', err);
                updateRequest.onFailure(err);
            });
    };

    const onUpdateGame = (g: Game) => {
        request.onSuccess({ ...g, pgn: request.data?.pgn ?? g.pgn });
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
                        onUpdateGame,
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
                            DefaultUnderboardTab.Share,
                            DefaultUnderboardTab.Settings,
                        ]}
                        allowMoveDeletion={request.data?.owner === user?.username}
                        allowDeleteBefore={request.data?.owner === user?.username}
                        showElapsedMoveTimes
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
                    onClose={() => updateSearchParams({ firstLoad: 'false' })}
                >
                    You can fill this data out now or later in settings.
                </MissingGameDataPreflight>
            )}
        </Box>
    );
};

export default GamePage;
