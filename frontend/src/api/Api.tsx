import { createContext, ReactNode, useContext, useMemo } from 'react';

import { useAuth } from '../auth/Auth';

import { User } from '../database/user';
import { Event } from '../database/event';
import { Requirement } from '../database/requirement';
import { TimelineEntry } from '../database/timeline';

import {
    UserApiContextType,
    getUser,
    getUserPublic,
    listUsersByCohort,
    searchUsers,
    updateUser,
    updateUserProgress,
    graduate,
    updateUserTimeline,
    getUserStatistics,
    checkUserAccess,
    listUserTimeline,
    editFollower,
    getFollower,
    listFollowers,
    listFollowing,
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
    deleteGame,
    listGamesByOpening,
    listGamesByPosition,
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
import {
    bookEvent,
    cancelEvent,
    createMessage,
    deleteEvent,
    EventApiContextType,
    getEvent,
    getEventCheckout,
    listEvents,
    setEvent,
} from './eventApi';
import {
    getCourse,
    listCourses,
    CourseApiContextType,
    listAllCourses,
    purchaseCourse,
    setCourse,
} from './courseApi';
import {
    adminBanPlayer,
    adminGetRegistrations,
    adminUnbanPlayer,
    getLeaderboard,
    getOpenClassical,
    listPreviousOpenClassicals,
    OpenClassicalPutPairingsRequest,
    OpenClassicalRegistrationRequest,
    OpenClassicalSubmitResultsRequest,
    putOpenClassicalPairings,
    registerForOpenClassical,
    submitResultsForOpenClassical,
    TimeControl,
    TimePeriod,
    TournamentApiContextType,
} from './tournamentApi';
import { TournamentType } from '../database/tournament';
import {
    NotificationApiContextType,
    listNotifications,
    deleteNotification,
} from './notificationApi';
import {
    createNewsfeedComment,
    getNewsfeedItem,
    listNewsfeed,
    NewsfeedApiContextType,
    setNewsfeedReaction,
} from './newsfeedApi';
import { getScoreboard, ScoreboardApiContextType } from './scoreboardApi';
import {
    ExplorerApiContextType,
    followPosition,
    FollowPositionRequest,
    getPosition,
} from './explorerApi';
import {
    createPaymentAccount,
    getPaymentAccount,
    paymentAccountLogin,
    PaymentApiContextType,
    subscriptionCheckout,
    SubscriptionCheckoutRequest,
    subscriptionManage,
} from './paymentApi';
import { Course } from '../database/course';
import {
    ClubApiContextType,
    createClub,
    getClub,
    leaveClub,
    listClubs,
    processJoinRequest,
    requestToJoinClub,
    updateClub,
} from './clubApi';
import { Club, ClubJoinRequestStatus } from '../database/club';

/**
 * ApiContextType defines the interface of the API as available through ApiProvider.
 */
type ApiContextType = UserApiContextType &
    EventApiContextType &
    GameApiContextType &
    RequirementApiContextType &
    GraduationApiContextType &
    CourseApiContextType &
    TournamentApiContextType &
    NotificationApiContextType &
    NewsfeedApiContextType &
    ScoreboardApiContextType &
    ExplorerApiContextType &
    PaymentApiContextType &
    ClubApiContextType;

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
            checkUserAccess: () => checkUserAccess(idToken),
            getUser: () => getUser(idToken),
            getUserPublic: (username: string) => getUserPublic(username),
            listUserTimeline: (owner: string, startKey?: string) =>
                listUserTimeline(idToken, owner, startKey),
            listUsersByCohort: (cohort: string, startKey?: string) =>
                listUsersByCohort(idToken, cohort, startKey),
            searchUsers,
            updateUser: (update: Partial<User>, autopickCohort?: boolean) =>
                updateUser(idToken, update, auth.updateUser, autopickCohort),
            updateUserProgress: (
                cohort: string,
                requirementId: string,
                incrementalCount: number,
                incrementalMinutesSpent: number,
                date: Date | null,
                notes: string
            ) =>
                updateUserProgress(
                    idToken,
                    cohort,
                    requirementId,
                    incrementalCount,
                    incrementalMinutesSpent,
                    date,
                    notes,
                    auth.updateUser
                ),
            updateUserTimeline: (
                requirementId: string,
                cohort: string,
                updated: TimelineEntry[],
                deleted: TimelineEntry[],
                count: number,
                minutesSpent: number
            ) =>
                updateUserTimeline(
                    idToken,
                    requirementId,
                    cohort,
                    updated,
                    deleted,
                    count,
                    minutesSpent,
                    auth.updateUser
                ),
            graduate: (comments: string) => graduate(idToken, comments, auth.updateUser),
            getUserStatistics: () => getUserStatistics(),
            getFollower: (poster: string) => getFollower(idToken, poster),
            editFollower: (poster: string, action: 'follow' | 'unfollow') =>
                editFollower(idToken, poster, action),
            listFollowers: (username: string, startKey?: string) =>
                listFollowers(username, startKey),
            listFollowing: (username: string, startKey?: string) =>
                listFollowing(username, startKey),

            bookEvent: (id: string, startTime?: Date, type?: string) =>
                bookEvent(idToken, id, startTime, type),
            getEventCheckout: (id: string) => getEventCheckout(idToken, id),
            cancelEvent: (id: string) => cancelEvent(idToken, id),
            deleteEvent: (id: string) => deleteEvent(idToken, id),
            getEvent: (id: string) => getEvent(idToken, id),
            listEvents: (startKey?: string) => listEvents(idToken, startKey),
            setEvent: (event: Event) => setEvent(idToken, event),
            createMessage: (id: string, content: string) =>
                createMessage(idToken, auth.user!, id, content),

            createGame: (req: CreateGameRequest) => createGame(idToken, req),
            getGame: (cohort: string, id: string) => getGame(idToken, cohort, id),
            featureGame: (cohort: string, id: string, featured: string) =>
                featureGame(idToken, cohort, id, featured),
            updateGame: (cohort: string, id: string, req: CreateGameRequest) =>
                updateGame(idToken, cohort, id, req),
            deleteGame: (cohort: string, id: string) => deleteGame(idToken, cohort, id),
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
            listGamesByOpening: (
                eco: string,
                startKey?: string,
                startDate?: string,
                endDate?: string
            ) => listGamesByOpening(idToken, eco, startKey, startDate, endDate),
            listGamesByPosition: (fen: string, startKey?: string) =>
                listGamesByPosition(idToken, fen, startKey),
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

            getCourse: (type: string, id: string, checkoutId?: string) =>
                getCourse(idToken, type, id, checkoutId),
            listCourses: (type: string, startKey?: string) =>
                listCourses(idToken, type, startKey),
            listAllCourses: (startKey?: string) => listAllCourses(startKey),
            purchaseCourse: (
                type: string,
                id: string,
                purchaseOption?: string,
                cancelUrl?: string
            ) => purchaseCourse(idToken, type, id, purchaseOption, cancelUrl),
            setCourse: (course: Course) => setCourse(idToken, course),

            getLeaderboard: (
                timePeriod: TimePeriod,
                tournamentType: TournamentType,
                timeControl: TimeControl,
                date: string
            ) => getLeaderboard(timePeriod, tournamentType, timeControl, date),

            getOpenClassical: (startsAt?: string) => getOpenClassical(startsAt),
            registerForOpenClassical: (req: OpenClassicalRegistrationRequest) =>
                registerForOpenClassical(idToken, req),
            submitResultsForOpenClassical: (req: OpenClassicalSubmitResultsRequest) =>
                submitResultsForOpenClassical(idToken, req),
            putOpenClassicalPairings: (req: OpenClassicalPutPairingsRequest) =>
                putOpenClassicalPairings(idToken, req),
            listPreviousOpenClassicals: (startKey?: string) =>
                listPreviousOpenClassicals(startKey),
            adminGetRegistrations: (region: string, section: string) =>
                adminGetRegistrations(idToken, region, section),
            adminBanPlayer: (username: string, region: string, section: string) =>
                adminBanPlayer(idToken, username, region, section),
            adminUnbanPlayer: (username: string) => adminUnbanPlayer(idToken, username),

            listNotifications: (startKey?: string) =>
                listNotifications(idToken, startKey),
            deleteNotification: (id: string) => deleteNotification(idToken, id),

            getNewsfeedItem: (owner: string, id: string) => getNewsfeedItem(owner, id),
            listNewsfeed: (
                newsfeedIds: string[],
                skipLastFetch?: boolean,
                startKey?: string
            ) => listNewsfeed(idToken, newsfeedIds, skipLastFetch, startKey),
            createNewsfeedComment: (
                props: { owner: string; id: string },
                content: string
            ) => createNewsfeedComment(idToken, props, content),
            setNewsfeedReaction: (owner: string, id: string, types: string[]) =>
                setNewsfeedReaction(idToken, owner, id, types),

            getScoreboard: (type: string) => getScoreboard(idToken, type),

            getPosition: (fen: string) => getPosition(idToken, fen),
            followPosition: (request: FollowPositionRequest) =>
                followPosition(idToken, request),

            subscriptionCheckout: (request: SubscriptionCheckoutRequest) =>
                subscriptionCheckout(idToken, request),
            subscriptionManage: () => subscriptionManage(idToken),
            createPaymentAccount: () => createPaymentAccount(idToken),
            getPaymentAccount: () => getPaymentAccount(idToken),
            paymentAccountLogin: () => paymentAccountLogin(idToken),

            createClub: (club: Partial<Club>) => createClub(idToken, club),
            updateClub: (id: string, data: Partial<Club>) =>
                updateClub(idToken, id, data),
            listClubs: (startKey?: string) => listClubs(startKey),
            getClub: (id: string, scoreboard?: boolean) => getClub(id, scoreboard),
            requestToJoinClub: (id: string, notes: string) =>
                requestToJoinClub(idToken, id, notes, auth.user),
            processJoinRequest: (
                clubId: string,
                username: string,
                status: ClubJoinRequestStatus
            ) => processJoinRequest(idToken, clubId, username, status),
            leaveClub: (clubId: string) => leaveClub(idToken, clubId),
        };
    }, [idToken, auth.user, auth.updateUser]);

    return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}
