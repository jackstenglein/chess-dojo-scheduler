import {
    createContext,
    ReactNode,
    useContext,
    useState,
    useCallback,
    useEffect,
} from 'react';

import { Meeting } from '../database/meeting';
import { Request, useRequest } from '../api/Request';
import { useApi } from './Api';
import { Availability } from '../database/availability';

/**
 * CacheContextType defines the type of the cache as available through CacheProvider
 */
type CacheContextType = {
    getMeeting: (id: string) => Meeting | undefined;
    getMeetings: () => Meeting[];
    filterMeetings: (filter: (meeting: Meeting) => boolean) => Meeting[];
    putMeeting: (meeting: Meeting) => void;
    putMeetings: (meetings: Meeting[]) => void;

    getAvailability: (id: string) => Availability | undefined;
    getAvailabilities: () => Availability[];
    putAvailability: (availability: Availability) => void;
    putAvailabilities: (availabilities: Availability[]) => void;
    removeAvailability: (id: string) => void;
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
    const [meetings, setMeetings] = useState<Record<string, Meeting>>({});
    const [availabilities, setAvailabilities] = useState<Record<string, Availability>>(
        {}
    );

    const getMeeting = useCallback(
        (id: string) => {
            return meetings[id];
        },
        [meetings]
    );

    const getMeetings = useCallback(() => Object.values(meetings), [meetings]);

    const filterMeetings = useCallback(
        (filter: (meeting: Meeting) => boolean) => {
            return Object.values(meetings).filter(filter);
        },
        [meetings]
    );

    const putMeeting = useCallback(
        (meeting: Meeting) => {
            setMeetings((meetings) => ({
                ...meetings,
                [meeting.id]: meeting,
            }));
        },
        [setMeetings]
    );

    const putMeetings = useCallback(
        (ms: Meeting[]) => {
            const newMeetingsMap = ms.reduce(
                (map: Record<string, Meeting>, meeting: Meeting) => {
                    map[meeting.id] = meeting;
                    return map;
                },
                {}
            );
            setMeetings((meetings) => ({
                ...meetings,
                ...newMeetingsMap,
            }));
        },
        [setMeetings]
    );

    const getAvailability = useCallback(
        (id: string) => {
            return availabilities[id];
        },
        [availabilities]
    );

    const getAvailabilities = useCallback(
        () => Object.values(availabilities),
        [availabilities]
    );

    const putAvailability = useCallback(
        (availability: Availability) => {
            setAvailabilities((availabilities) => ({
                ...availabilities,
                [availability.id]: availability,
            }));
        },
        [setAvailabilities]
    );

    const putAvailabilities = useCallback(
        (a: Availability[]) => {
            const newAvailabilityMap = a.reduce(
                (map: Record<string, Availability>, availability: Availability) => {
                    map[availability.id] = availability;
                    return map;
                },
                {}
            );
            setAvailabilities((availabilities) => ({
                ...availabilities,
                ...newAvailabilityMap,
            }));
        },
        [setAvailabilities]
    );

    const removeAvailability = useCallback(
        (id: string) => {
            setAvailabilities((availabilities) => {
                const { [id]: removed, ...others } = availabilities;
                return others;
            });
        },
        [setAvailabilities]
    );

    const value = {
        getMeeting,
        getMeetings,
        filterMeetings,
        putMeeting,
        putMeetings,
        getAvailability,
        getAvailabilities,
        putAvailability,
        putAvailabilities,
        removeAvailability,
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

    const meetings = cache.getMeetings();

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();

            api.listMeetings()
                .then((result) => {
                    result.sort((lhs, rhs) => lhs.startTime.localeCompare(rhs.startTime));
                    request.onSuccess();
                    cache.putMeetings(result);
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
    request: Request;
}

const TWO_DAYS = 24 * 60 * 60 * 1000 * 2;

export function useCalendar(): UseCalendarResponse {
    const api = useApi();
    const cache = useCache();
    const request = useRequest();

    const meetings = cache.getMeetings();
    const availabilities = cache.getAvailabilities();

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();

            const startTime = new Date(new Date().getTime() - TWO_DAYS);
            api.getCalendar(startTime)
                .then((result) => {
                    request.onSuccess();
                    cache.putMeetings(result.meetings);
                    cache.putAvailabilities(result.availabilities);
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [request, api, cache]);

    return {
        meetings,
        availabilities,
        request,
    };
}
