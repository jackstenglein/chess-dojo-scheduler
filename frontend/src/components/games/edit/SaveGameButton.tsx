import { EventType, trackEvent } from '@/analytics/events';
import { useApi } from '@/api/Api';
import { GameSubmissionType, toPgnDate, UpdateGameRequest } from '@/api/gameApi';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { useChess } from '@/board/pgn/PgnBoard';
import { Game, PgnHeaders } from '@/database/game';
import { LoadingButton } from '@mui/lab';
import { useState } from 'react';
import SaveGameDialogue, { Form as SaveGameForm } from './SaveGameDialogue';

interface SaveGameButtonProps {
    game: Game;
    unlisted: boolean;
    headers: PgnHeaders;
    dirty: boolean;
    onSaveGame?: (game: Game) => void;
}

export const SaveGameButton = ({
    game,
    unlisted,
    //headers,
    dirty,
    onSaveGame,
}: SaveGameButtonProps) => {
    const { chess } = useChess();
    const api = useApi();
    const request = useRequest();
    const [showPreflight, setShowPreflight] = useState<boolean>(false);
    const loading = request.isLoading();

    const isPublishing = (game.unlisted ?? false) && !unlisted;
    //const needsPreflight = !unlisted && isMissingData({ ...game, headers });

    const onShowPreflight = () => {
        setShowPreflight(true);
    };

    const onClosePreflight = () => {
        setShowPreflight(false);
        request.reset();
    };

    const onSave = (form: SaveGameForm) => {
        request.onStart();

        const newHeaders = {
            white: form.white,
            black: form.black,
            result: form.result,
            date: toPgnDate(form.date) ?? '',
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
                setShowPreflight(false);
                onSaveGame?.(resp.data);
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
                onClick={() => onShowPreflight()}
            >
                {isPublishing ? 'Publish' : 'Save Changes'}
            </LoadingButton>
            <SaveGameDialogue
                open={showPreflight}
                onClose={onClosePreflight}
                onSubmit={onSave}
                loading={loading}
                title='Provide missing data'
            >
                Your game is missing data. Please fill out these fields to publish your
                analysis.
            </SaveGameDialogue>
        </>
    );
};
