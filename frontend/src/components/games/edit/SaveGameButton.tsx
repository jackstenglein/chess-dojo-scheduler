import { EventType, trackEvent } from '@/analytics/events';
import { useApi } from '@/api/Api';
import {
    BoardOrientation,
    GameHeader,
    GameSubmissionType,
    isMissingData,
    UpdateGameRequest,
} from '@/api/gameApi';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { useChess } from '@/board/pgn/PgnBoard';
import { SaveGameDialogue } from '@/components/games/edit/SaveGameDialogue';
import { Game, PgnHeaders } from '@/database/game';
import { LoadingButton } from '@mui/lab';
import { useState } from 'react';

interface SaveGameButtonProps {
    game: Game;
    unlisted: boolean;
    orientation: BoardOrientation;
    headers: PgnHeaders;
    headersChanged: boolean;
    dirty: boolean;
    onSaveGame?: (g: Game) => void;
}

export const SaveGameButton = ({
    game,
    unlisted,
    orientation,
    headers,
    headersChanged,
    dirty,
    onSaveGame,
}: SaveGameButtonProps) => {
    const { chess } = useChess();
    const api = useApi();
    const request = useRequest();
    const [showPreflight, setShowPreflight] = useState<boolean>(false);
    const loading = request.isLoading();

    const isPublishing = (game.unlisted ?? false) && !unlisted;
    const needsPreflight = !unlisted && isMissingData({ ...game, headers });

    const onShowPreflight = () => {
        setShowPreflight(true);
    };

    const onClosePreflight = () => {
        setShowPreflight(false);
        request.reset();
    };

    const onSave = (newHeaders?: GameHeader, newOrientation?: BoardOrientation) => {
        request.onStart();

        if (!newHeaders && headersChanged) {
            newHeaders = {
                white: headers.White || '?',
                black: headers.Black || '??',
                result: headers.Result,
                date: headers.Date,
            };
        }

        const update: UpdateGameRequest = {
            orientation: newOrientation || orientation,
            timelineId: game.timelineId,
        };

        if (isPublishing) {
            update.unlisted = false;
        } else if (!game.unlisted && unlisted) {
            update.unlisted = true;
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

                onSaveGame?.(resp.data);
                request.onSuccess();
                setShowPreflight(false);
            })
            .catch((err) => {
                console.error('updateGame: ', err);
                request.onFailure(err);
            });
    };

    return (
        <>
            <RequestSnackbar request={request} showSuccess />
            <LoadingButton
                variant='contained'
                disabled={!dirty}
                loading={loading}
                onClick={() => (needsPreflight ? onShowPreflight() : onSave())}
            >
                {isPublishing ? 'Publish' : 'Save Changes'}
            </LoadingButton>
            <SaveGameDialogue
                open={showPreflight}
                onClose={onClosePreflight}
                initHeaders={headers}
                initOrientation={orientation}
                onSubmit={onSave}
                loading={loading}
            >
                Your game is missing data. Please fill out these fields to publish your
                analysis.
            </SaveGameDialogue>
        </>
    );
};
