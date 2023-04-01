import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../api/Api';
import { CreateGameRequest } from '../api/gameApi';
import { RequestSnackbar, useRequest } from '../api/Request';
import GameSubmissionForm from './GameSubmissionForm';

const EditGamePage = () => {
    const api = useApi();
    const request = useRequest();
    const { cohort, id } = useParams();
    const navigate = useNavigate();

    const onCreate = (req: CreateGameRequest) => {
        request.onStart();
        request.onStart();
        api.createGame(req)
            .then((response) => {
                navigate(
                    `../${response.data.cohort.replaceAll(
                        '+',
                        '%2B'
                    )}/${response.data.id.replaceAll('?', '%3F')}`
                );
                request.onSuccess();
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
            .then(() => {
                navigate(`/games/${cohort}/${id}`);
                request.onSuccess();
            })
            .catch((err) => {
                console.error('updateGame: ', err);
                request.onFailure(err);
            });
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
                onSubmit={onSubmit}
            />

            <RequestSnackbar request={request} />
        </>
    );
};

export default EditGamePage;
