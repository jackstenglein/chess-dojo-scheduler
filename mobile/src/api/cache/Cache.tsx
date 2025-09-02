import {
    createContext,
    ReactNode,
    useContext,
    useState,
    useCallback,
    useEffect,
    useMemo,
} from 'react';

import { Request, useRequest } from '../Request';
import { useApi } from '../Api';
import { AuthStatus, useAuth } from '../../auth/Auth';
import { Requirement } from '../../database/requirement';
import { Event } from '../../database/event';
import { Notification } from '../../database/notification';

interface Identifiable {
    id: string;
}

interface IdentifiableCache<T> {
    get: (id: string) => T | undefined;
    list: () => T[];
    filter: (predicate: (obj: T) => boolean) => T[];
    put: (obj: T) => void;
    putMany: (objs: T[]) => void;
    remove: (id: string) => void;
}

function useIdentifiableCache<T extends Identifiable>(): IdentifiableCache<T> {
    const [objects, setObjects] = useState<Record<string, T>>({});

    const get = useCallback(
        (id: string) => {
            return objects[id];
        },
        [objects]
    );

    const list = useCallback(() => Object.values(objects), [objects]);

    const filter = useCallback(
        (predicate: (obj: T) => boolean) => {
            return Object.values(objects).filter(predicate);
        },
        [objects]
    );

    const put = useCallback(
        (obj: T) => {
            setObjects((objects) => ({
                ...objects,
                [obj.id]: obj,
            }));
        },
        [setObjects]
    );

    const putMany = useCallback(
        (objs: T[]) => {
            const newMap = objs.reduce((map: Record<string, T>, obj: T) => {
                map[obj.id] = obj;
                return map;
            }, {});
            setObjects((objects) => ({
                ...objects,
                ...newMap,
            }));
        },
        [setObjects]
    );

    const remove = useCallback(
        (id: string) => {
            setObjects((objects) => {
                const { [id]: removed, ...others } = objects;
                return others;
            });
        },
        [setObjects]
    );

    return {
        get,
        list,
        filter,
        put,
        putMany,
        remove,
    };
}

interface CohortCache {
    isFetched: (cohort: string) => boolean;
    markFetched: (cohort: string) => void;
}

/**
 * CacheContextType defines the type of the cache as available through CacheProvider
 */
type CacheContextType = {
    isLoading: boolean;
    setIsLoading: (arg: boolean) => void;

    events: IdentifiableCache<Event>;
    requirements: IdentifiableCache<Requirement> & CohortCache;
    notifications: IdentifiableCache<Notification>;

    imageBypass: number;
    setImageBypass: (v: number) => void;
};

const CacheContext = createContext<CacheContextType>(null!);

/**
 * @returns The current CacheContextType value.
 */
export function useCache() {
    return useContext(CacheContext);
}

/**
 * CacheProvider provides access to cached data. It implements the CacheContextType interface.
 * @param param0 React props. The only used prop is children.
 * @returns A CacheContext.Provider wrapping the provided children.
 */
export function CacheProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(false);
    const events = useIdentifiableCache<Event>();
    const requirements = useIdentifiableCache<Requirement>();
    const notifications = useIdentifiableCache<Notification>();
    const [imageBypass, setImageBypass] = useState(Date.now());

    const [fetchedCohorts, setFetchedCohorts] = useState<Record<string, boolean>>({});

    const isFetched = useCallback(
        (cohort: string) => {
            return fetchedCohorts[cohort] || false;
        },
        [fetchedCohorts]
    );

    const markFetched = useCallback(
        (cohort: string) => {
            setFetchedCohorts((cohorts) => ({
                ...cohorts,
                [cohort]: true,
            }));
        },
        [setFetchedCohorts]
    );

    const value = {
        isLoading,
        setIsLoading,
        events,
        requirements: { ...requirements, isFetched, markFetched },
        notifications,
        imageBypass,
        setImageBypass,
    };
    return <CacheContext.Provider value={value}>{children}</CacheContext.Provider>;
}

interface UseEventsResponse {
    events: Event[];
    request: Request;
    putEvent: (e: Event) => void;
    removeEvent: (id: string) => void;
}

export function useEvents(): UseEventsResponse {
    const auth = useAuth();
    const api = useApi();
    const cache = useCache();
    const request = useRequest();

    const events = useMemo(() => cache.events.list(), [cache.events]);

    useEffect(() => {
        if (auth.status !== AuthStatus.Loading && !request.isSent()) {
            request.onStart();
            cache.setIsLoading(true);

            api.listEvents()
                .then((events) => {
                    console.log('Got events: ', events);
                    request.onSuccess();
                    cache.events.putMany(events);
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                })
                .finally(() => {
                    cache.setIsLoading(false);
                });
        }
    }, [auth.status, request, api, cache]);

    return {
        events,
        request,

        putEvent: cache.events.put,
        removeEvent: cache.events.remove,
    };
}

interface UseNotificationsResponse {
    notifications: Notification[];
    request: Request;
    removeNotification: (id: string) => void;
}

export function useNotifications(): UseNotificationsResponse {
    const auth = useAuth();
    const api = useApi();
    const cache = useCache();
    const request = useRequest();

    const notifications = useMemo(
        () => cache.notifications.list(),
        [cache.notifications]
    );

    useEffect(() => {
        if (auth.status === AuthStatus.Authenticated && !request.isSent()) {
            request.onStart();

            api.listNotifications()
                .then((resp) => {
                    request.onSuccess();
                    cache.notifications.putMany(resp.data.notifications);
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [auth.status, request, api, cache]);

    return {
        notifications,
        request,

        removeNotification: cache.notifications.remove,
    };
}
