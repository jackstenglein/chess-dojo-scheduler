import { createContext, ReactNode, useContext, useMemo } from 'react';

import { useAuth } from '../auth/Auth';
import { Availability } from '../database/availability';
import { User } from '../database/user';
import {
    AdminApiContextType,
    adminListAvailabilities,
    adminListUsers,
    adminListMeetings,
    adminGetStatistics,
} from './adminApi';
import {
    AvailabilityApiContextType,
    bookAvailability,
    deleteAvailability,
    getAvailabilities,
    getAvailabilitiesByTime,
    setAvailability,
} from './availabilityApi';
import { CalendarApiContextType, getCalendar } from './calendarApi';
import {
    cancelMeeting,
    getMeeting,
    listMeetings,
    MeetingApiContextType,
} from './meetingApi';
import { UserApiContextType, getUser, updateUser } from './userApi';
import {
    GameApiContextType,
    CreateGameRequest,
    createGame,
    getGame,
    listGamesByCohort,
    listGamesByOwner,
    createComment,
} from './gameApi';

/**
 * ApiContextType defines the interface of the API as available through ApiProvider.
 */
type ApiContextType = AdminApiContextType &
    UserApiContextType &
    AvailabilityApiContextType &
    MeetingApiContextType &
    CalendarApiContextType &
    GameApiContextType;

const ApiContext = createContext<ApiContextType>(null!);

/**
 * @returns The current ApiContext value.
 */
export function useApi() {
    return useContext(ApiContext);
}

/**
 * ApiProvider provides access to API calls. It implements the ApiContextType interface.
 * ApiProvider must be a child of AuthProvider.
 * @param param0 React props. The only used prop is children.
 * @returns An ApiContext.Provider wrapping the provided children.
 */
export function ApiProvider({ children }: { children: ReactNode }) {
    const auth = useAuth();
    const idToken = auth.user?.cognitoUser?.session?.idToken.jwtToken ?? '';

    const value = useMemo(() => {
        return {
            adminListUsers: (startKey?: string) => adminListUsers(idToken, startKey),
            adminListAvailabilities: (startKey?: string) =>
                adminListAvailabilities(idToken, startKey),
            adminListMeetings: (startKey?: string) =>
                adminListMeetings(idToken, startKey),
            adminGetStatistics: () => adminGetStatistics(idToken),

            getUser: () => getUser(idToken),
            updateUser: (update: Partial<User>) =>
                updateUser(idToken, update, auth.updateUser),

            setAvailability: (a: Availability) => setAvailability(idToken, a),
            deleteAvailability: (id: string) => deleteAvailability(idToken, id),
            bookAvailability: (a: Availability, time?: Date, type?: string) =>
                bookAvailability(idToken, a, time, type),
            getAvailabilities: (limit?: number, startKey?: string) =>
                getAvailabilities(idToken, limit, startKey),
            getAvailabilitiesByTime: (
                startTime: string,
                limit?: number,
                startKey?: string
            ) => getAvailabilitiesByTime(idToken, startTime, limit, startKey),

            getMeeting: (id: string) => getMeeting(idToken, id),
            cancelMeeting: (id: string) => cancelMeeting(idToken, id),
            listMeetings: (limit?: number, startKey?: string) =>
                listMeetings(idToken, limit, startKey),

            getCalendar: (startTime: Date, startKey?: string) =>
                getCalendar(idToken, startTime, startKey),

            createGame: (req: CreateGameRequest) => createGame(idToken, req),
            getGame: (cohort: string, id: string) => getGame(idToken, cohort, id),
            listGamesByCohort: (
                cohort: string,
                startKey?: string,
                startDate?: string,
                endDate?: string
            ) => listGamesByCohort(idToken, cohort, startKey, startDate, endDate),
            listGamesByOwner: (
                startKey?: string,
                startDate?: string,
                endDate?: string,
                player?: string,
                color?: string
            ) => listGamesByOwner(idToken, startKey, startDate, endDate, player, color),
            createComment: (cohort: string, id: string, content: string) =>
                createComment(idToken, auth.user!, cohort, id, content),
        };
    }, [idToken, auth.user, auth.updateUser]);

    return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}
