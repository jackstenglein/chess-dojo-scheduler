import { DateTime } from 'luxon';
import { createContext, ReactNode, useContext, useMemo } from 'react';
import { useAuth } from '../auth/Auth';
import { Club, ClubJoinRequestStatus } from '../database/club';
import { Course } from '../database/course';
import { Event } from '../database/event';
import { ExamAttempt, ExamType } from '../database/exam';
import { GameReviewType, PositionComment } from '../database/game';
import { Requirement } from '../database/requirement';
import { TimelineEntry } from '../database/timeline';
import { LeaderboardSite, TournamentType } from '../database/tournament';
import { User } from '../database/user';
import {
    batchGetClubs,
    ClubApiContextType,
    createClub,
    getClub,
    joinClub,
    leaveClub,
    listClubs,
    processJoinRequest,
    requestToJoinClub,
    updateClub,
} from './clubApi';
import {
    CourseApiContextType,
    getCourse,
    listAllCourses,
    listCourses,
    purchaseCourse,
    setCourse,
} from './courseApi';
import {
    createSupportTicket,
    EmailApiContextType,
    SupportTicketRequest,
} from './emailApi';
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
import { ExamApiContextType, getExamAnswer, listExams, putExamAttempt } from './examApi';
import {
    ExplorerApiContextType,
    followPosition,
    FollowPositionRequest,
    getPosition,
} from './explorerApi';
import {
    createComment,
    createGame,
    CreateGameRequest,
    deleteComment,
    DeleteCommentRequest,
    deleteGame,
    featureGame,
    GameApiContextType,
    getGame,
    listFeaturedGames,
    listGamesByCohort,
    listGamesByOpening,
    listGamesByOwner,
    listGamesByPosition,
    listGamesForReview,
    markReviewed,
    requestReview,
    updateComment,
    UpdateCommentRequest,
    updateGame,
} from './gameApi';
import {
    GraduationApiContextType,
    listGraduationsByCohort,
    listGraduationsByDate,
    listGraduationsByOwner,
} from './graduationApi';
import {
    createNewsfeedComment,
    getNewsfeedItem,
    listNewsfeed,
    NewsfeedApiContextType,
    setNewsfeedReaction,
} from './newsfeedApi';
import {
    deleteNotification,
    listNotifications,
    NotificationApiContextType,
} from './notificationApi';
import {
    createPaymentAccount,
    getPaymentAccount,
    paymentAccountLogin,
    PaymentApiContextType,
    subscriptionCheckout,
    SubscriptionCheckoutRequest,
    subscriptionManage,
} from './paymentApi';
import {
    getRequirement,
    listRequirements,
    RequirementApiContextType,
    setRequirement,
} from './requirementApi';
import { getScoreboard, ScoreboardApiContextType } from './scoreboardApi';
import {
    adminBanPlayer,
    adminCompleteTournament,
    adminEmailPairings,
    adminGetRegistrations,
    adminUnbanPlayer,
    adminVerifyResult,
    adminWithdrawPlayer,
    getLeaderboard,
    getOpenClassical,
    listPreviousOpenClassicals,
    OpenClassicalPutPairingsRequest,
    OpenClassicalRegistrationRequest,
    OpenClassicalSubmitResultsRequest,
    OpenClassicalVerifyResultRequest,
    putOpenClassicalPairings,
    registerForOpenClassical,
    submitResultsForOpenClassical,
    TimeControl,
    TimePeriod,
    TournamentApiContextType,
} from './tournamentApi';
import {
    checkUserAccess,
    editFollower,
    getFollower,
    getUser,
    getUserPublic,
    getUserStatistics,
    graduate,
    listFollowers,
    listFollowing,
    listUsersByCohort,
    listUserTimeline,
    searchUsers,
    updateUser,
    updateUserProgress,
    updateUserTimeline,
    UserApiContextType,
} from './userApi';

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
    ClubApiContextType &
    ExamApiContextType &
    EmailApiContextType;

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
    const idToken = auth.user?.cognitoUser?.session.idToken.jwtToken ?? '';

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
                date: DateTime | null,
                notes: string,
            ) =>
                updateUserProgress(
                    idToken,
                    cohort,
                    requirementId,
                    incrementalCount,
                    incrementalMinutesSpent,
                    date,
                    notes,
                    auth.updateUser,
                ),
            updateUserTimeline: (
                requirementId: string,
                cohort: string,
                updated: TimelineEntry[],
                deleted: TimelineEntry[],
                count: number,
                minutesSpent: number,
            ) =>
                updateUserTimeline(
                    idToken,
                    requirementId,
                    cohort,
                    updated,
                    deleted,
                    count,
                    minutesSpent,
                    auth.updateUser,
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
            getGame: (cohort: string, id: string) => getGame(cohort, id),
            featureGame: (cohort: string, id: string, featured: string) =>
                featureGame(idToken, cohort, id, featured),
            updateGame: (cohort: string, id: string, req: CreateGameRequest) =>
                updateGame(idToken, cohort, id, req),
            deleteGame: (cohort: string, id: string) => deleteGame(idToken, cohort, id),
            listGamesByCohort: (
                cohort: string,
                startKey?: string,
                startDate?: string,
                endDate?: string,
            ) => listGamesByCohort(idToken, cohort, startKey, startDate, endDate),
            listGamesByOwner: (
                owner?: string,
                startKey?: string,
                startDate?: string,
                endDate?: string,
                player?: string,
                color?: string,
            ) =>
                listGamesByOwner(
                    idToken,
                    owner,
                    startKey,
                    startDate,
                    endDate,
                    player,
                    color,
                ),
            listGamesByOpening: (
                eco: string,
                startKey?: string,
                startDate?: string,
                endDate?: string,
            ) => listGamesByOpening(idToken, eco, startKey, startDate, endDate),
            listGamesByPosition: (fen: string, startKey?: string) =>
                listGamesByPosition(idToken, fen, startKey),
            listFeaturedGames: (startKey?: string) =>
                listFeaturedGames(idToken, startKey),
            listGamesForReview: (startKey?: string) =>
                listGamesForReview(idToken, startKey),
            createComment: (
                cohort: string,
                id: string,
                comment: PositionComment,
                existingComments: boolean,
            ) => createComment(idToken, cohort, id, comment, existingComments),
            updateComment: (update: UpdateCommentRequest) =>
                updateComment(idToken, update),
            deleteComment: (request: DeleteCommentRequest) =>
                deleteComment(idToken, request),
            requestReview: (cohort: string, id: string, reviewType: GameReviewType) =>
                requestReview(idToken, cohort, id, reviewType),
            markReviewed: (cohort: string, id: string) =>
                markReviewed(idToken, cohort, id),

            getRequirement: (id: string) => getRequirement(idToken, id),
            listRequirements: (
                cohort: string,
                scoreboardOnly: boolean,
                startKey?: string,
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
                cancelUrl?: string,
            ) => purchaseCourse(idToken, type, id, purchaseOption, cancelUrl),
            setCourse: (course: Course) => setCourse(idToken, course),

            getLeaderboard: (
                site: LeaderboardSite,
                timePeriod: TimePeriod,
                tournamentType: TournamentType,
                timeControl: TimeControl,
                date: string,
            ) => getLeaderboard(site, timePeriod, tournamentType, timeControl, date),

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
            adminWithdrawPlayer: (username: string, region: string, section: string) =>
                adminWithdrawPlayer(idToken, username, region, section),
            adminEmailPairings: (round: number) => adminEmailPairings(idToken, round),
            adminVerifyResult: (request: OpenClassicalVerifyResultRequest) =>
                adminVerifyResult(idToken, request),
            adminCompleteTournament: (nextStartDate: string) =>
                adminCompleteTournament(idToken, nextStartDate),

            listNotifications: (startKey?: string) =>
                listNotifications(idToken, startKey),
            deleteNotification: (id: string) => deleteNotification(idToken, id),

            getNewsfeedItem: (owner: string, id: string) => getNewsfeedItem(owner, id),
            listNewsfeed: (
                newsfeedIds: string[],
                skipLastFetch?: boolean,
                startKey?: string,
            ) => listNewsfeed(idToken, newsfeedIds, skipLastFetch, startKey),
            createNewsfeedComment: (
                props: { owner: string; id: string },
                content: string,
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
            batchGetClubs: (ids: string[]) => batchGetClubs(ids),
            joinClub: (id: string) => joinClub(idToken, id),
            requestToJoinClub: (id: string, notes: string) =>
                requestToJoinClub(idToken, id, notes, auth.user),
            processJoinRequest: (
                clubId: string,
                username: string,
                status: ClubJoinRequestStatus,
            ) => processJoinRequest(idToken, clubId, username, status),
            leaveClub: (clubId: string) => leaveClub(idToken, clubId),

            listExams: (type: ExamType, startKey?: string) =>
                listExams(idToken, type, startKey),
            putExamAttempt: (examType: ExamType, examId: string, attempt: ExamAttempt) =>
                putExamAttempt(idToken, examType, examId, attempt),
            getExamAnswer: (id: string) => getExamAnswer(idToken, id),

            createSupportTicket: (request: SupportTicketRequest) =>
                createSupportTicket(idToken, request),
        };
    }, [idToken, auth.user, auth.updateUser]);

    return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}
