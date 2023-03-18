import {
    createContext,
    ReactNode,
    useContext,
    useState,
    useCallback,
    useEffect,
    useMemo,
} from 'react';

import { Meeting } from '../../database/meeting';
import { Request, useRequest } from '../Request';
import { useApi } from '../Api';
import { Availability } from '../../database/availability';
import { AuthStatus, useAuth } from '../../auth/Auth';
import { Requirement } from '../../database/requirement';

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

    meetings: IdentifiableCache<Meeting>;
    availabilities: IdentifiableCache<Availability>;
    requirements: IdentifiableCache<Requirement> & CohortCache;
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
    const meetings = useIdentifiableCache<Meeting>();
    const availabilities = useIdentifiableCache<Availability>();
    const requirements = useIdentifiableCache<Requirement>();

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
        meetings,
        availabilities,
        requirements: { ...requirements, isFetched, markFetched },
    };
    return <CacheContext.Provider value={value}>{children}</CacheContext.Provider>;
}

interface UseMeetingsResponse {
    meetings: Meeting[];
    request: Request;
}

export function useMeetings(): UseMeetingsResponse {
    const api = useApi();
    const cache = useCache();
    const request = useRequest();

    const meetings = cache.meetings.list();

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();

            api.listMeetings()
                .then((result) => {
                    result.sort((lhs, rhs) => lhs.startTime.localeCompare(rhs.startTime));
                    request.onSuccess();
                    cache.meetings.putMany(result);
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [request, api, cache]);

    return {
        meetings,
        request,
    };
}

interface UseCalendarResponse {
    meetings: Meeting[];
    availabilities: Availability[];
    putAvailability: (a: Availability) => void;
    removeAvailability: (id: string) => void;
    request: Request;
}

const TWO_DAYS = 24 * 60 * 60 * 1000 * 2;

export function useCalendar(): UseCalendarResponse {
    const auth = useAuth();
    const api = useApi();
    const cache = useCache();
    const request = useRequest();

    const meetings = useMemo(() => cache.meetings.list(), [cache.meetings]);
    const availabilities = useMemo(
        () => cache.availabilities.list(),
        [cache.availabilities]
    );

    useEffect(() => {
        if (auth.status === AuthStatus.Authenticated && !request.isSent()) {
            request.onStart();
            cache.setIsLoading(true);

            const startTime = new Date(new Date().getTime() - TWO_DAYS);
            api.getCalendar(startTime)
                .then((result) => {
                    console.log('Calendar result: ', result);
                    request.onSuccess();
                    cache.meetings.putMany(result.meetings);
                    cache.availabilities.putMany(result.availabilities);
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
        meetings,
        availabilities,
        putAvailability: cache.availabilities.put,
        removeAvailability: cache.availabilities.remove,
        request,
    };
}
