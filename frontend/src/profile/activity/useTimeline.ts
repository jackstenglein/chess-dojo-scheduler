import { useCallback, useEffect, useState } from 'react';
import { useApi } from '../../api/Api';
import { TimelineEntry } from '../../database/requirement';
import { Request, useRequest } from '../../api/Request';

export interface UseTimelineResponse {
    request: Request;
    entries: TimelineEntry[];
    hasMore: boolean;
    onLoadMore: () => void;
}

export function useTimeline(owner: string): UseTimelineResponse {
    const api = useApi();
    const [entries, setEntries] = useState<TimelineEntry[]>([]);
    const [startKey, setStartKey] = useState<string>();
    const request = useRequest();

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.listUserTimeline(owner, startKey)
                .then((res) => {
                    console.log('listUserTimeline: ', res);
                    request.onSuccess();
                    setEntries(
                        entries
                            .concat(res.entries)
                            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                    );
                    setStartKey(res.lastEvaluatedKey);
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [request, api, owner, startKey, entries, setEntries, setStartKey]);

    const reset = request.reset;
    const onLoadMore = useCallback(() => {
        reset();
    }, [reset]);

    return {
        request,
        entries,
        hasMore: startKey !== undefined,
        onLoadMore,
    };
}
