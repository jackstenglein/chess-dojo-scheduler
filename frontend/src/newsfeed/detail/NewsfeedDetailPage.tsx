import { Container } from '@mui/material';
import { useApi } from '../../api/Api';
import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { TimelineEntry } from '../../database/requirement';
import NewsfeedItem from '../NewsfeedItem';
import LoadingPage from '../../loading/LoadingPage';
import NotFoundPage from '../../NotFoundPage';

type NewsfeedDetailPageParams = {
    owner: string;
    id: string;
};

const NewsfeedDetailPage = () => {
    const { owner, id } = useParams<NewsfeedDetailPageParams>();
    const api = useApi();
    const request = useRequest<TimelineEntry>();

    useEffect(() => {
        if (!request.isSent() && owner && id) {
            request.onStart();
            api.getNewsfeedItem(owner, id)
                .then((resp) => {
                    console.log('getNewsfeedItem: ', resp);
                    request.onSuccess(resp.data);
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [api, request, owner, id]);

    const reset = request.reset;
    useEffect(() => {
        reset();
    }, [reset, owner, id]);

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    if (!request.data) {
        return <NotFoundPage />;
    }

    return (
        <Container maxWidth='md' sx={{ pt: 6, pb: 4 }}>
            <RequestSnackbar request={request} />

            <NewsfeedItem entry={request.data} onEdit={request.onSuccess} />
        </Container>
    );
};

export default NewsfeedDetailPage;
