/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
'use client';

import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { AuthStatus, useAuth } from '../../auth/Auth';
import { Club } from '../../database/club';
import { Event } from '../../database/event';
import { Notification } from '../../database/notification';
import { Requirement } from '../../database/requirement';
import { useApi } from '../Api';
import { GetExplorerPositionResult } from '../explorerApi';
import { Request, useRequest } from '../Request';

export interface IdentifiableCache<T> {
    get: (id: string) => T | undefined;
    list: () => T[];
    filter: (predicate: (obj: T) => boolean) => T[];
    put: (obj: T) => void;
    putMany: (objs: T[]) => void;
    update: (obj: Partial<T>) => void;
    remove: (id: string) => void;
    isFetched: (id: string) => boolean;
    markFetched: (id: string) => void;
    request: Request;
}

export function useIdentifiableCache<T>(
    keyGetter?: (item: Partial<T>) => string,
): IdentifiableCache<T> {
    const [objects, setObjects] = useState<Record<string, T>>({});
    const fetchedIds = useRef<Record<string, boolean>>({});
    const request = useRequest();

    const get = useCallback(
        (id: string) => {
            return objects[id];
        },
        [objects],
    );

    const list = useCallback(() => Object.values(objects), [objects]);

    const filter = useCallback(
        (predicate: (obj: T) => boolean) => {
            return Object.values(objects).filter(predicate);
        },
        [objects],
    );

    const put = useCallback(
        (obj: T) => {
            const id = keyGetter ? keyGetter(obj) : (obj as any).id;
            setObjects((objects) => ({
                ...objects,
                [id]: obj,
            }));
        },
        [setObjects, keyGetter],
    );

    const putMany = useCallback(
        (objs: T[]) => {
            const newMap = objs.reduce((map: Record<string, T>, obj: T) => {
                const id = keyGetter ? keyGetter(obj) : (obj as any).id;
                map[id] = obj;
                return map;
            }, {});
            setObjects((objects) => ({
                ...objects,
                ...newMap,
            }));
        },
        [setObjects, keyGetter],
    );

    const update = useCallback(
        (obj: Partial<T>) => {
            const id = keyGetter ? keyGetter(obj) : (obj as any).id;
            if (!id) {
                return;
            }

            setObjects((objects) => {
                if (!objects[id]) {
                    return objects;
                }
                return {
                    ...objects,
                    [id]: {
                        ...objects[id],
                        obj,
                    },
                };
            });
        },
        [setObjects, keyGetter],
    );

    const remove = useCallback(
        (id: string) => {
            setObjects((objects) => {
                const { [id]: removed, ...others } = objects;
                return others;
            });
        },
        [setObjects],
    );

    const isFetched = useCallback(
        (id: string) => {
            return fetchedIds.current[id] || false;
        },
        [fetchedIds],
    );

    const markFetched = useCallback(
        (id: string) => {
            fetchedIds.current = {
                ...fetchedIds.current,
                [id]: true,
            };
        },
        [fetchedIds],
    );

    return {
        get,
        list,
        filter,
        put,
        putMany,
        update,
        remove,
        isFetched,
        markFetched,
        request,
    };
}

/**
 * CacheContextType defines the type of the cache as available through CacheProvider
 */
interface CacheContextType {
    isLoading: boolean;
    setIsLoading: (arg: boolean) => void;

    events: IdentifiableCache<Event>;
    requirements: IdentifiableCache<Requirement>;
    notifications: IdentifiableCache<Notification>;
    positions: IdentifiableCache<GetExplorerPositionResult>;
    clubs: IdentifiableCache<Club>;
    
    // Additional API caches
    users: IdentifiableCache<any>;
    games: IdentifiableCache<any>;
    courses: IdentifiableCache<any>;
    tournaments: IdentifiableCache<any>;
    scoreboard: IdentifiableCache<any>;
    payments: IdentifiableCache<any>;
    exams: IdentifiableCache<any>;
    graduations: IdentifiableCache<any>;
    newsfeed: IdentifiableCache<any>;
    directories: IdentifiableCache<any>;
    emails: IdentifiableCache<any>;
    yearReviews: IdentifiableCache<any>;

    imageBypass: number;
    setImageBypass: (v: number) => void;
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
    const [isLoading, setIsLoading] = useState(true);
    const events = useIdentifiableCache<Event>();
    const requirements = useIdentifiableCache<Requirement>();
    const notifications = useIdentifiableCache<Notification>();
    const positions = useIdentifiableCache<GetExplorerPositionResult>(
        (item) => item?.normalizedFen || '',
    );
    const clubs = useIdentifiableCache<Club>();
    
    // Additional API caches
    const users = useIdentifiableCache<any>();
    const games = useIdentifiableCache<any>();
    const courses = useIdentifiableCache<any>();
    const tournaments = useIdentifiableCache<any>();
    const scoreboard = useIdentifiableCache<any>();
    const payments = useIdentifiableCache<any>();
    const exams = useIdentifiableCache<any>();
    const graduations = useIdentifiableCache<any>();
    const newsfeed = useIdentifiableCache<any>();
    const directories = useIdentifiableCache<any>();
    const emails = useIdentifiableCache<any>();
    const yearReviews = useIdentifiableCache<any>();
    
    const [imageBypass, setImageBypass] = useState(Date.now());

    const value = {
        isLoading,
        setIsLoading,
        events,
        requirements,
        notifications,
        positions,
        clubs,
        users,
        games,
        courses,
        tournaments,
        scoreboard,
        payments,
        exams,
        graduations,
        newsfeed,
        directories,
        emails,
        yearReviews,
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
    const request = cache.events.request;

    const events = useMemo(() => cache.events.list(), [cache.events]);

    useEffect(() => {
        if (auth.status !== AuthStatus.Loading && !request.isSent()) {
            request.onStart();
            cache.setIsLoading(true);

            api.listEvents()
                .then((events) => {
                    request.onSuccess();
                    cache.events.putMany(events);
                })
                .catch((err) => {
                    console.error('Events API error:', err);
                    // In offline mode, don't mark as failure if we have cached data
                    if (typeof window !== 'undefined' && !navigator.onLine && events.length > 0) {
                        console.log('[Cache] Using cached events in offline mode');
                        request.onSuccess();
                    } else {
                        request.onFailure(err);
                    }
                })
                .finally(() => {
                    cache.setIsLoading(false);
                });
        }
    }, [auth.status, request, api, cache, events.length]);

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

    const notifications = useMemo(() => cache.notifications.list(), [cache.notifications]);

    useEffect(() => {
        if (auth.status === AuthStatus.Authenticated && !request.isSent()) {
            request.onStart();

            api.listNotifications()
                .then((resp) => {
                    request.onSuccess();
                    cache.notifications.putMany(resp.data.notifications);
                })
                .catch((err) => {
                    console.error('Notifications API error:', err);
                    // In offline mode, don't mark as failure if we have cached data
                    if (typeof window !== 'undefined' && !navigator.onLine && notifications.length >= 0) {
                        console.log('[Cache] Using cached notifications in offline mode');
                        request.onSuccess();
                    } else {
                        request.onFailure(err);
                    }
                });
        }
    }, [auth.status, request, api, cache, notifications.length]);

    return {
        notifications,
        request,

        removeNotification: cache.notifications.remove,
    };
}
