import { useCallback, useEffect, useState } from 'react';
import { Container, Stack } from '@mui/material';

import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { ListNewsfeedResponse } from '../../api/newsfeedApi';
import { useAuth } from '../../auth/Auth';
import LoadingPage from '../../loading/LoadingPage';
import NewsfeedItem from '../detail/NewsfeedItem';
import { TimelineEntry } from '../../database/timeline';
import LoadMoreButton from './LoadMoreButton';

const MAX_COMMENTS = 3;

const NewsfeedListPage = () => {
    const api = useApi();
    const user = useAuth().user!;
    const request = useRequest<ListNewsfeedResponse>();
    const [data, setData] = useState<ListNewsfeedResponse>();
    const [lastStartKey, setLastStartKey] = useState('');

    const handleResponse = useCallback(
        (resp: ListNewsfeedResponse) => {
            setLastStartKey(data?.lastEvaluatedKey || '');

            const seen: Record<string, boolean> = {};
            const newEntries = (data?.entries || [])
                .concat(
                    resp.entries.sort((lhs, rhs) =>
                        rhs.createdAt.localeCompare(lhs.createdAt)
                    )
                )
                .filter((e) => {
                    return seen.hasOwnProperty(e.id) ? false : (seen[e.id] = true);
                });

            setData({
                entries: newEntries,
                lastFetch: resp.lastFetch,
                lastEvaluatedKey: resp.lastEvaluatedKey,
            });
        },
        [setLastStartKey, data]
    );

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.listNewsfeed(user.dojoCohort)
                .then((resp) => {
                    console.log('listNewsfeed: ', resp);
                    handleResponse(resp.data);
                    request.onSuccess();
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [request, api, user.dojoCohort, handleResponse]);

    if (!request.isSent() || (request.isLoading() && !data)) {
        return <LoadingPage />;
    }

    const onEdit = (i: number, entry: TimelineEntry) => {
        const newData = data?.entries || [];
        setData({
            entries: [...newData.slice(0, i), entry, ...newData.slice(i + 1)],
            lastFetch: data?.lastFetch || '',
            lastEvaluatedKey: data?.lastEvaluatedKey || '',
        });
    };

    let skipLastFetch = true;
    let startKey = data?.lastEvaluatedKey || '';
    if (data?.lastFetch && data.lastEvaluatedKey) {
        skipLastFetch = false;
    } else if (data?.lastFetch) {
        startKey = lastStartKey;
    }

    const onLoadMore = () => {
        request.onStart();
        api.listNewsfeed(user.dojoCohort, skipLastFetch, startKey)
            .then((resp) => {
                console.log('listNewsfeed: ', resp);
                handleResponse(resp.data);
                request.onSuccess();
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
                {data?.entries.map((entry, i) => (
                    <NewsfeedItem
                        key={entry.id}
                        entry={entry}
                        onEdit={(e) => onEdit(i, e)}
                        maxComments={MAX_COMMENTS}
                    />
                ))}

                <LoadMoreButton
                    request={request}
                    since={data?.lastFetch}
                    startKey={startKey}
                    onLoadMore={onLoadMore}
                />
            </Stack>
        </Container>
    );
};

export default NewsfeedListPage;
