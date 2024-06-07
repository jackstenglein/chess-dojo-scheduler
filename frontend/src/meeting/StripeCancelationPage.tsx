import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useApi } from '../api/Api';
import { useRequest } from '../api/Request';
import { useCache } from '../api/cache/Cache';

const StripeCancelationPage = () => {
    const { meetingId } = useParams();
    const api = useApi();
    const request = useRequest();
    const cache = useCache();
    const put = cache.events.put;

    useEffect(() => {
        if (meetingId && !request.isSent()) {
            request.onStart();
            api.cancelEvent(meetingId)
                .then((resp) => {
                    console.log('cancelEvent: ', resp);
                    request.onSuccess();
                    put(resp.data);
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [request, api, meetingId, put]);

    return <Navigate to='/calendar' replace />;
};

export default StripeCancelationPage;
