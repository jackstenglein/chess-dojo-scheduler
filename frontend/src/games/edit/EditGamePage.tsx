import { useNavigate, useParams } from 'react-router-dom';

import { EventType, trackEvent } from '../../analytics/events';
import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { UpdateGameRequest, isGame } from '../../api/gameApi';

const EditGamePage = () => {
    const api = useApi();
    const request = useRequest();
    const { cohort, id } = useParams();
    const navigate = useNavigate();

    const onEdit = (req: UpdateGameRequest) => {
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
                }
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

    return (
        <>
            <div>TODO</div>

            <RequestSnackbar request={request} showSuccess />
        </>
    );
};

export default EditGamePage;
