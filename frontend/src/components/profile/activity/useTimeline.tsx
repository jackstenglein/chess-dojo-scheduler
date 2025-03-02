import { useApi } from '@/api/Api';
import { Request, useRequest } from '@/api/Request';
import { TimelineEntry } from '@/database/timeline';
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';

export interface UseTimelineResponse {
    request: Request;
    entries: TimelineEntry[];
    hasMore: boolean;
    onLoadMore: () => void;
    resetRequest: () => void;
    onEdit: (i: number, entry: TimelineEntry) => void;
    onNewEntry: (entry: TimelineEntry) => void;
}

const TimelineContext = createContext<UseTimelineResponse | undefined>(undefined);
export const useTimelineContext = () => {
    const context = useContext(TimelineContext);
    if (!context) {
        throw new Error('useTimelineContext must be used within a TimelineProvider');
    }
    return context;
};

interface TimelineProviderProps {
    owner: string;
    children: ReactNode;
}

export const TimelineProvider: React.FC<TimelineProviderProps> = ({
    owner,
    children,
}) => {
    const api = useApi();
    const [entries, setEntries] = useState<TimelineEntry[]>([]);
    const [startKey, setStartKey] = useState<string>();
    const request = useRequest();

    useEffect(() => {
        if (owner && !request.isSent()) {
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

    const resetRequest = useCallback(() => {
        setStartKey(undefined);
        setEntries([]);
        reset();
    }, [reset, setStartKey]);

    const onEdit = useCallback(
        (i: number, entry: TimelineEntry) => {
            setEntries((e) => [...e.slice(0, i), entry, ...e.slice(i + 1)]);
        },
        [setEntries],
    );

    const onNewEntry = useCallback(
        (entry: TimelineEntry) => {
            setEntries((e) =>
                [entry, ...e].sort((a, b) =>
                    (b.date || b.createdAt).localeCompare(a.date || a.createdAt),
                ),
            );
        },
        [setEntries],
    );

    const timelineData = {
        request,
        entries,
        hasMore: startKey !== undefined,
        onLoadMore,
        resetRequest,
        onEdit,
        onNewEntry,
    };

    return (
        <TimelineContext.Provider value={timelineData}>
            {children}
        </TimelineContext.Provider>
    );
};
