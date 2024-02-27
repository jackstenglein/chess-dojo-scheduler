import { useCallback, useEffect, useState } from 'react';
import { useApi } from '../../api/Api';
import { Request, useRequest } from '../../api/Request';
import { TimelineEntry } from '../../database/timeline';

export interface UseTimelineResponse {
    request: Request;
    entries: TimelineEntry[];
    hasMore: boolean;
    onLoadMore: () => void;
    onEdit: (i: number, entry: TimelineEntry) => void;
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
                            .sort((a, b) =>
                                (b.date || b.createdAt).localeCompare(
                                    a.date || a.createdAt,
                                ),
                            ),
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

    const onEdit = useCallback(
        (i: number, entry: TimelineEntry) => {
            setEntries((e) => [...e.slice(0, i), entry, ...e.slice(i + 1)]);
        },
        [setEntries],
    );

    return {
        request,
        entries,
        hasMore: startKey !== undefined,
        onLoadMore,
        onEdit,
    };
}
