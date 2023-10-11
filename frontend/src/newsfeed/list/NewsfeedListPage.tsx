import { useEffect } from 'react';
import { Container, Stack } from '@mui/material';

import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { ListNewsfeedResponse } from '../../api/newsfeedApi';
import { useAuth } from '../../auth/Auth';
import LoadingPage from '../../loading/LoadingPage';
import NewsfeedItem from '../detail/NewsfeedItem';
import { TimelineEntry } from '../../database/requirement';
import CaughtUpMessage from './CaughtUpMessage';

const MAX_COMMENTS = 3;

const NewsfeedListPage = () => {
    const api = useApi();
    const user = useAuth().user!;
    const request = useRequest<ListNewsfeedResponse>();

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.listNewsfeed(user.dojoCohort)
                .then((resp) => {
                    console.log('listNewsfeed: ', resp);
                    request.onSuccess({
                        entries: (request.data?.entries || [])
                            .concat(resp.data.entries)
                            .sort((lhs, rhs) =>
                                rhs.createdAt.localeCompare(lhs.createdAt)
                            ),
                        lastEvaluatedKey: resp.data.lastEvaluatedKey,
                    });
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

    const onEdit = (i: number, entry: TimelineEntry) => {
        const data = request.data?.entries || [];
        request.onSuccess({
            entries: [...data.slice(0, i), entry, ...data.slice(i + 1)],
            lastEvaluatedKey: request.data?.lastEvaluatedKey || '',
        });
    };

    return (
        <Container maxWidth='md' sx={{ pt: 6, pb: 4 }}>
            <RequestSnackbar request={request} />

            <Stack spacing={3}>
                {request.data?.entries.map((entry, i) => (
                    <NewsfeedItem
                        key={entry.id}
                        entry={entry}
                        onEdit={(e) => onEdit(i, e)}
                        maxComments={MAX_COMMENTS}
                    />
                ))}

                <CaughtUpMessage since='2023-10-09' />
            </Stack>
        </Container>
    );
};

export default NewsfeedListPage;
