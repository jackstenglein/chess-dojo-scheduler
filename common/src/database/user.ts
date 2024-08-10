import { ExamType } from './exam';
import { CustomTask, RequirementProgress } from './requirement';

/** A summary of a user's performance on a single exam. */
export interface UserExamSummary {
    /** The type of the exam this summary refers to. */
    examType: ExamType;

    /** The cohort range of the exam this summary refers to. */
    cohortRange: string;

    /** The date the user took the exam, in ISO format. */
    createdAt: string;

    /** The rating the user got on the exam, as determined by the exam's linear regression. */
    rating: number;
}

export interface User {
    username: string;
    displayName: string;
    discordUsername: string;
    dojoCohort: string;
    bio: string;
    coachBio?: string;

    subscriptionStatus: string;

    ratingSystem: RatingSystem;
    ratings: Partial<Record<RatingSystem, Rating>>;
    ratingHistories?: Record<RatingSystem, RatingHistory[]>;

    progress: Record<string, RequirementProgress>;
    disableBookingNotifications: boolean;
    disableCancellationNotifications: boolean;
    isAdmin: boolean;
    isCalendarAdmin: boolean;
    isTournamentAdmin: boolean;
    isBetaTester: boolean;
    isCoach: boolean;
    createdAt: string;
    updatedAt: string;
    numberOfGraduations: number;
    previousCohort: string;
    graduationCohorts?: string[];
    lastGraduatedAt: string;

    enableLightMode: boolean;
    timezoneOverride: string;
    timeFormat: TimeFormat;

    hasCreatedProfile: boolean;

    customTasks?: CustomTask[];

    openingProgress?: Record<
        string,
        {
            exercises?: boolean[];
        }
    >;

    tutorials?: Record<string, boolean>;
    minutesSpent?: Record<MinutesSpentKey, number>;

    followerCount: number;
    followingCount: number;

    referralSource: string;

    notificationSettings: UserNotificationSettings;

    totalDojoScore: number;

    purchasedCourses?: Record<string, boolean>;

    paymentInfo?: PaymentInfo;

    coachInfo?: CoachInfo;

    /** The set of club ids the user is a member of. */
    clubs?: string[];

    /** A map from exam id to the user's summary for that exam. */
    exams: Record<string, UserExamSummary>;
}

export interface PaymentInfo {
    customerId: string;
}

export interface CoachInfo {
    stripeId: string;
    onboardingComplete: boolean;
}

export interface UserNotificationSettings {
    discordNotificationSettings?: DiscordNotificationSettings;
    emailNotificationSettings?: EmailNotificationSettings;
    siteNotificationSettings?: SiteNotificationSettings;
}

export interface DiscordNotificationSettings {
    disableMeetingBooking: boolean;
    disableMeetingCancellation: boolean;
}

export interface EmailNotificationSettings {
    disableNewsletter: boolean;
    disableInactiveWarning: boolean;
}

export interface SiteNotificationSettings {
    disableGameComment: boolean;
    disableNewFollower: boolean;
    disableNewsfeedComment: boolean;
    disableNewsfeedReaction: boolean;
}

export type MinutesSpentKey =
    | 'ALL_TIME'
    | 'LAST_7_DAYS'
    | 'LAST_30_DAYS'
    | 'LAST_90_DAYS'
    | 'LAST_365_DAYS'
    | 'NON_DOJO'
    | 'ALL_COHORTS_ALL_TIME'
    | 'ALL_COHORTS_LAST_7_DAYS'
    | 'ALL_COHORTS_LAST_30_DAYS'
    | 'ALL_COHORTS_LAST_90_DAYS'
    | 'ALL_COHORTS_LAST_365_DAYS'
    | 'ALL_COHORTS_NON_DOJO';

export enum RatingSystem {
    Chesscom = 'CHESSCOM',
    Lichess = 'LICHESS',
    Fide = 'FIDE',
    Uscf = 'USCF',
    Ecf = 'ECF',
    Cfc = 'CFC',
    Dwz = 'DWZ',
    Acf = 'ACF',
    Knsb = 'KNSB',
    Custom = 'CUSTOM',
}

export interface Rating {
    username?: string;
    hideUsername: boolean;
    startRating: number;
    currentRating: number;
    name?: string;
}

export interface RatingHistory {
    date: string;
    rating: number;
}

export enum SubscriptionStatus {
    Subscribed = 'SUBSCRIBED',
    FreeTier = 'FREE_TIER',
}

export enum TimeFormat {
    Default = '',
    TwelveHour = '12',
    TwentyFourHour = '24',
}
