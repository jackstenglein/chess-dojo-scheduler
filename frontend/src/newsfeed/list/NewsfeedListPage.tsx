import { useCallback, useEffect, useState } from 'react';
import { Container, Stack } from '@mui/material';

import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { ListNewsfeedResponse } from '../../api/newsfeedApi';
import { useAuth } from '../../auth/Auth';
import LoadingPage from '../../loading/LoadingPage';
import NewsfeedItem from '../detail/NewsfeedItem';
import { TimelineEntry } from '../../database/requirement';
import LoadMoreButton from './LoadMoreButton';

const MAX_COMMENTS = 3;

const NewsfeedListPage = () => {
    const api = useApi();
    const user = useAuth().user!;
    const request = useRequest<ListNewsfeedResponse>();
    const [lastStartKey, setLastStartKey] = useState('');

    const handleResponse = useCallback(
        (resp: ListNewsfeedResponse) => {
            setLastStartKey(request.data?.lastEvaluatedKey || '');
            request.onSuccess({
                entries: (request.data?.entries || []).concat(
                    resp.entries.sort((lhs, rhs) =>
                        rhs.createdAt.localeCompare(lhs.createdAt)
                    )
                ),
                lastFetch: resp.lastFetch,
                lastEvaluatedKey: resp.lastEvaluatedKey,
            });
        },
        [setLastStartKey, request]
    );

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.listNewsfeed(user.dojoCohort)
                .then((resp) => {
                    console.log('listNewsfeed: ', resp);
                    handleResponse(resp.data);
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [request, api, user.dojoCohort, handleResponse]);

    if (!request.isSent() || (request.isLoading() && !request.data)) {
        return <LoadingPage />;
    }

    const onEdit = (i: number, entry: TimelineEntry) => {
        const data = request.data?.entries || [];
        request.onSuccess({
            entries: [...data.slice(0, i), entry, ...data.slice(i + 1)],
            lastFetch: request.data?.lastFetch || '',
            lastEvaluatedKey: request.data?.lastEvaluatedKey || '',
        });
    };

    let skipLastFetch = true;
    let startKey = request.data?.lastEvaluatedKey || '';
    if (request.data?.lastFetch && request.data.lastEvaluatedKey) {
        skipLastFetch = false;
    } else if (request.data?.lastFetch) {
        startKey = lastStartKey;
    }

    const onLoadMore = () => {
        request.onStart();
        api.listNewsfeed(user.dojoCohort, skipLastFetch, startKey)
            .then((resp) => {
                console.log('listNewsfeed: ', resp);
                handleResponse(resp.data);
            })
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
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

                <LoadMoreButton
                    request={request}
                    since={request.data?.lastFetch}
                    startKey={startKey}
                    onLoadMore={onLoadMore}
                />
            </Stack>
        </Container>
    );
};

export default NewsfeedListPage;
