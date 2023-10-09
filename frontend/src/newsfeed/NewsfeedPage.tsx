import { useEffect } from 'react';
import { Container, Stack } from '@mui/material';

import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { ListNewsfeedResponse } from '../api/newsfeedApi';
import { useAuth } from '../auth/Auth';
import LoadingPage from '../loading/LoadingPage';
import NewsfeedItem from './NewsfeedItem';

const NewsfeedPage = () => {
    const api = useApi();
    const user = useAuth().user!;
    const request = useRequest<ListNewsfeedResponse>();

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.listNewsfeed(user.dojoCohort)
                .then((resp) => {
                    console.log('listNewsfeed: ', resp);
                    request.onSuccess(resp.data);
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [request, api, user.dojoCohort]);

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    return (
        <Container maxWidth='md' sx={{ pt: 6, pb: 4 }}>
            <RequestSnackbar request={request} />

            <Stack spacing={3}>
                {request.data?.entries.map((entry) => (
                    <NewsfeedItem key={entry.id} timelineEntry={entry} />
                ))}
            </Stack>
        </Container>
    );
};

export default NewsfeedPage;
