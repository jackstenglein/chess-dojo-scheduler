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
    adminListRequirements,
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
import {
    UserApiContextType,
    getUser,
    getUserPublic,
    listUsersByCohort,
    updateUser,
    updateUserProgress,
    graduate,
} from './userApi';
import {
    GameApiContextType,
    CreateGameRequest,
    createGame,
    getGame,
    listGamesByCohort,
    listGamesByOwner,
    listFeaturedGames,
    createComment,
    featureGame,
    updateGame,
} from './gameApi';
import {
    RequirementApiContextType,
    getRequirement,
    listRequirements,
    setRequirement,
} from './requirementApi';
import {
    GraduationApiContextType,
    listGraduationsByCohort,
    listGraduationsByOwner,
    listGraduationsByDate,
} from './graduationApi';
import { Requirement } from '../database/requirement';

/**
 * ApiContextType defines the interface of the API as available through ApiProvider.
 */
type ApiContextType = AdminApiContextType &
    UserApiContextType &
    AvailabilityApiContextType &
    MeetingApiContextType &
    CalendarApiContextType &
    GameApiContextType &
    RequirementApiContextType &
    GraduationApiContextType;

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
            adminListRequirements: (startKey?: string) =>
                adminListRequirements(idToken, startKey),

            getUser: () => getUser(idToken),
            getUserPublic: (username: string) => getUserPublic(username),
            listUsersByCohort: (cohort: string, startKey?: string) =>
                listUsersByCohort(idToken, cohort, startKey),
            updateUser: (update: Partial<User>) =>
                updateUser(idToken, update, auth.updateUser),
            updateUserProgress: (
                cohort: string,
                requirementId: string,
                incrementalCount: number,
                incrementalMinutesSpent: number
            ) =>
                updateUserProgress(
                    idToken,
                    cohort,
                    requirementId,
                    incrementalCount,
                    incrementalMinutesSpent,
                    auth.updateUser
                ),
            graduate: (comments: string) => graduate(idToken, comments, auth.updateUser),

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
            featureGame: (cohort: string, id: string, featured: string) =>
                featureGame(idToken, cohort, id, featured),
            updateGame: (cohort: string, id: string, req: CreateGameRequest) =>
                updateGame(idToken, cohort, id, req),
            listGamesByCohort: (
                cohort: string,
                startKey?: string,
                startDate?: string,
                endDate?: string
            ) => listGamesByCohort(idToken, cohort, startKey, startDate, endDate),
            listGamesByOwner: (
                owner?: string,
                startKey?: string,
                startDate?: string,
                endDate?: string,
                player?: string,
                color?: string
            ) =>
                listGamesByOwner(
                    idToken,
                    owner,
                    startKey,
                    startDate,
                    endDate,
                    player,
                    color
                ),
            listFeaturedGames: (startKey?: string) =>
                listFeaturedGames(idToken, startKey),
            createComment: (cohort: string, id: string, content: string) =>
                createComment(idToken, auth.user!, cohort, id, content),

            getRequirement: (id: string) => getRequirement(idToken, id),
            listRequirements: (
                cohort: string,
                scoreboardOnly: boolean,
                startKey?: string
            ) => listRequirements(idToken, cohort, scoreboardOnly, startKey),
            setRequirement: (requirement: Requirement) =>
                setRequirement(idToken, requirement),

            listGraduationsByCohort: (cohort: string, startKey?: string) =>
                listGraduationsByCohort(idToken, cohort, startKey),
            listGraduationsByOwner: (username: string, startKey?: string) =>
                listGraduationsByOwner(idToken, username, startKey),
            listGraduationsByDate: (startKey?: string) =>
                listGraduationsByDate(idToken, startKey),
        };
    }, [idToken, auth.user, auth.updateUser]);

    return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}
