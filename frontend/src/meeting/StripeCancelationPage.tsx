import { Navigate, useParams } from 'react-router-dom';

import { useApi } from '../api/Api';
import { useEffect } from 'react';
import { useRequest } from '../api/Request';

const StripeCancelationPage = () => {
    const { meetingId } = useParams();
    const api = useApi();
    const request = useRequest();

    useEffect(() => {
        if (meetingId && !request.isSent()) {
            request.onStart();
            api.cancelEvent(meetingId)
                .then((resp) => {
                    console.log('cancelEvent: ', resp);
                    request.onSuccess();
                })
                .then((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [request, api, meetingId]);

    return <Navigate to='/calendar' replace />;
};

export default StripeCancelationPage;
