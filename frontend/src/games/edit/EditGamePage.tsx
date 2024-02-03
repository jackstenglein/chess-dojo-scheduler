import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useApi } from '../../api/Api';
import { CreateGameRequest, GameHeader, isGame } from '../../api/gameApi';
import { RequestSnackbar, useRequest } from '../../api/Request';
import GameSubmissionForm from './GameSubmissionForm';
import SubmitGamePreflight from './SubmitGamePreflight';
import { EventType, trackEvent } from '../../analytics/events';

interface Preflight {
    req: CreateGameRequest;
    headers: GameHeader[];
    function: 'create' | 'edit';
}

const EditGamePage = () => {
    const api = useApi();
    const request = useRequest();
    const { cohort, id } = useParams();
    const navigate = useNavigate();

    const [preflight, setPreflight] = useState<Preflight>();

    const onCreate = (req: CreateGameRequest) => {
        request.onStart();
        api.createGame(req)
            .then((response) => {
                if (isGame(response.data)) {
                    const game = response.data;
                    trackEvent(EventType.SubmitGame, {
                        count: 1,
                        method: req.type,
                    });
                    navigate(
                        `../${game.cohort.replaceAll('+', '%2B')}/${game.id.replaceAll(
                            '?',
                            '%3F'
                        )}`
                    );
                } else if (response.data.headers) {
                    request.onSuccess();
                    setPreflight({
                        function: 'create',
                        req,
                        headers: response.data.headers,
                    });
                } else {
                    const count = response.data.count;
                    trackEvent(EventType.SubmitGame, {
                        count: count,
                        method: req.type,
                    });
                    request.onSuccess(`Created ${count} games`);
                    navigate('/profile?view=games');
                }
            })
            .catch((err) => {
                console.error('CreateGame ', err);
                request.onFailure(err);
            });
    };

    const onEdit = (req: CreateGameRequest) => {
        if (!cohort || !id) {
            return;
        }
        request.onStart();
        api.updateGame(cohort, id, req)
            .then((response) => {
                if (isGame(response.data)) {
                    trackEvent(EventType.UpdateGame, {
                        method: req.type,
                        dojo_cohort: cohort,
                    });
                    navigate(`/games/${cohort}/${id}`);
                } else if (response.data.headers) {
                    request.onSuccess();
                    setPreflight({
                        function: 'edit',
                        req,
                        headers: response.data.headers,
                    });
                }
            })
            .catch((err) => {
                console.error('updateGame: ', err);
                request.onFailure(err);
            });
    };

    const onPreflight = (headers: GameHeader[]) => {
        console.log('Headers: ', headers);
        if (preflight?.function === 'create') {
            onCreate({ ...preflight.req, headers });
        } else if (preflight?.function === 'edit') {
            onEdit({ ...preflight.req, headers });
        }
    };

    const title = cohort && id ? 'Edit Game' : 'Submit Game';
    const description =
        cohort && id
            ? "Overwrite this game's PGN data? Any comments will remain."
            : undefined;
    const onSubmit = cohort && id ? onEdit : onCreate;

    return (
        <>
            <GameSubmissionForm
                title={title}
                description={description}
                loading={request.isLoading()}
                isCreating={id === undefined}
                onSubmit={onSubmit}
            />

            <RequestSnackbar request={request} showSuccess />

            {preflight && (
                <SubmitGamePreflight
                    open={true}
                    onClose={() => setPreflight(undefined)}
                    initHeaders={preflight.headers}
                    loading={request.isLoading()}
                    onSubmit={onPreflight}
                />
            )}
        </>
    );
};

export default EditGamePage;
