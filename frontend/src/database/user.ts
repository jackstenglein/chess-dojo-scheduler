import { getCohortRangeInt } from '@jackstenglein/chess-dojo-common/src/database/cohort';
import { AuthTokens } from 'aws-amplify/auth';
import { ExamType } from './exam';
import { CustomTask, RequirementProgress } from './requirement';
import { ScoreboardSummary } from './scoreboard';

/** The user as returned by Cognito. */
export interface CognitoUser {
    /** The user's username. */
    username: string;

    /** The user's authentication tokens. */
    tokens?: AuthTokens;
}

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
    Custom2 = 'CUSTOM_2',
    Custom3 = 'CUSTOM_3',
}

export function formatRatingSystem(ratingSystem: RatingSystem | string): string {
    switch (ratingSystem) {
        case RatingSystem.Chesscom:
            return 'Chess.com Rapid';
        case RatingSystem.Lichess:
            return 'Lichess Classical';
        case RatingSystem.Fide:
            return 'FIDE';
        case RatingSystem.Uscf:
            return 'USCF';
        case RatingSystem.Ecf:
            return 'ECF';
        case RatingSystem.Cfc:
            return 'CFC';
        case RatingSystem.Dwz:
            return 'DWZ';
        case RatingSystem.Acf:
            return 'ACF';
        case RatingSystem.Knsb:
            return 'KNSB';
        case RatingSystem.Custom:
        case RatingSystem.Custom2:
        case RatingSystem.Custom3:
            return 'Custom';
    }
    return ratingSystem;
}

/**
 * Returns true if the given rating system is a custom system.
 * @param ratingSystem The rating system to check.
 */
export function isCustom(ratingSystem: RatingSystem | string | undefined): boolean {
    return (
        ratingSystem === RatingSystem.Custom ||
        ratingSystem === RatingSystem.Custom2 ||
        ratingSystem === RatingSystem.Custom3
    );
}

export interface Rating {
    username: string;
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

export interface User {
    cognitoUser?: CognitoUser;

    username: string;
    displayName: string;
    discordUsername: string;
    discordid?: string;
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
    /** Whether to enable zen mode. */
    enableZenMode: boolean;
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

    /** The IDs of the user's pinned tasks. */
    pinnedTasks?: string[];
}

export type UserSummary = Pick<User, 'username' | 'displayName' | 'dojoCohort'>;

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

export function parseUser(
    apiResponse: Omit<User, 'cognitoUser'>,
    cognitoUser?: CognitoUser,
): User {
    return {
        ...apiResponse,
        cognitoUser,
    };
}

export function getStartRating(user?: User | ScoreboardSummary): number {
    if (!user) {
        return 0;
    }
    return getSystemStartRating(user, user.ratingSystem);
}

export function getSystemStartRating(
    user: User | ScoreboardSummary | undefined,
    ratingSystem: RatingSystem,
): number {
    if (!user) {
        return 0;
    }
    const rating = user.ratings[ratingSystem];
    return rating?.startRating || 0;
}

export function getCurrentRating(user?: User | ScoreboardSummary): number {
    if (!user) {
        return 0;
    }
    return getSystemCurrentRating(user, user.ratingSystem);
}

export function getSystemCurrentRating(
    user: User | ScoreboardSummary | undefined,
    ratingSystem: RatingSystem,
): number {
    if (!user) {
        return 0;
    }
    const rating = user.ratings[ratingSystem];
    return rating?.currentRating || 0;
}

export function getRatingUsername(
    user: User | undefined,
    ratingSystem: RatingSystem,
): string {
    if (!user) {
        return '';
    }
    const rating = user.ratings[ratingSystem];
    return rating?.username || '';
}

export function hideRatingUsername(
    user: User | undefined,
    ratingSystem: RatingSystem,
): boolean {
    if (!user) {
        return true;
    }
    const rating = user.ratings[ratingSystem];
    return rating?.hideUsername || false;
}

export const dojoCohorts: string[] = [
    '0-300',
    '300-400',
    '400-500',
    '500-600',
    '600-700',
    '700-800',
    '800-900',
    '900-1000',
    '1000-1100',
    '1100-1200',
    '1200-1300',
    '1300-1400',
    '1400-1500',
    '1500-1600',
    '1600-1700',
    '1700-1800',
    '1800-1900',
    '1900-2000',
    '2000-2100',
    '2100-2200',
    '2200-2300',
    '2300-2400',
    '2400+',
];

export const ALL_COHORTS = 'ALL_COHORTS';

export const cohortColors: Record<string, string> = {
    '0-300': '#f8d0f5',
    '300-400': '#eb92c8',
    '400-500': '#c768bc',
    '500-600': '#f1e156',
    '600-700': '#c8c71d',
    '700-800': '#a3951b',
    '800-900': '#eea44f',
    '900-1000': '#d97333',
    '1000-1100': '#9b4007',
    '1100-1200': '#70ec50',
    '1200-1300': '#71c44e',
    '1300-1400': '#0c5c03',
    '1400-1500': '#5551ec',
    '1500-1600': '#004aad',
    '1600-1700': '#003375',
    '1700-1800': '#ae03ff',
    '1800-1900': '#ac00c8',
    '1900-2000': '#6b017d',
    '2000-2100': '#fd0304',
    '2100-2200': '#c21818',
    '2200-2300': '#951313',
    '2300-2400': '#bd4804',
    '2400+': '#9e3b00',
};

export function compareCohorts(a: string, b: string): number {
    const aInt = parseInt(a);
    const bInt = parseInt(b);
    if (aInt < bInt) {
        return -1;
    }
    return 1;
}

/**
 * Returns true if lhs > rhs
 * @param lhs The left-hand cohort to compare.
 * @param rhs The right-hand cohort to compare.
 */
export function isCohortGreater(lhs: string, rhs: string): boolean {
    return parseInt(lhs) > parseInt(rhs);
}

/**
 * Returns true if lhs < rhs
 * @param lhs The left-hand cohort to compare.
 * @param rhs The right-hand cohort to compare.
 */
export function isCohortLess(lhs: string, rhs: string): boolean {
    return parseInt(lhs) < parseInt(rhs);
}

/**
 * Returns true if the provided cohort is in the given half-open range [inclusive, exclusive).
 * @param cohort The cohort to check.
 * @param range The range to check. Does not have to be a real cohort (Ex: 1500-2000 or 2000+).
 */
export function isCohortInRange(cohort: string | undefined, range: string): boolean {
    if (!cohort) {
        return false;
    }

    const minCohort = parseInt(range);
    const maxCohort =
        range.split('-').length > 1 ? parseInt(range.split('-')[1]) : undefined;
    const userCohort = parseInt(cohort);

    if (!maxCohort) {
        return userCohort >= minCohort;
    }
    return userCohort >= minCohort && userCohort < maxCohort;
}

/**
 * Returns true if rating is in the provided half-open range [inclusive, exclusive).
 * @param rating The rating to check.
 * @param range The range to check. Does not have to be a real cohort (Ex: 1500-2000 or 2000+).
 */
export function isRatingInRange(rating: number, range: string): boolean {
    const [minCohort, maxCohort] = getCohortRangeInt(range);
    return rating >= minCohort && rating < maxCohort;
}

/**
 * Returns a list of cohorts within the given cohort range (inclusive).
 * @param minCohort The minimum cohort to include. If not provided, start at 0-300.
 * @param maxCohort The maximum cohort to include. If not provided, end at 2400+.
 * @returns A list of cohorts between minCohort and maxCohort.
 */
export function getCohortRange(
    minCohort: string | undefined,
    maxCohort: string | undefined,
): string[] {
    const min = Math.max(minCohort ? dojoCohorts.indexOf(minCohort) : 0, 0);
    const max = Math.min(
        maxCohort ? dojoCohorts.indexOf(maxCohort) + 1 : dojoCohorts.length,
        dojoCohorts.length,
    );
    return dojoCohorts.slice(min, max);
}

/**
 * Returns the cohort that the normalized rating fits into.
 * @param rating The normalized rating to convert to a cohort.
 * @returns The cohort or undefined if the rating is invalid.
 */
export function normalizedRatingToCohort(rating: number): string | undefined {
    if (rating < 0) {
        return undefined;
    }
    for (const cohort of dojoCohorts) {
        if (isRatingInRange(rating, cohort)) {
            return cohort;
        }
    }
    return undefined;
}

const ratingBoundaries: Record<string, Record<RatingSystem, number>> = {
    '0-300': {
        [RatingSystem.Chesscom]: 550,
        [RatingSystem.Lichess]: 1250,
        [RatingSystem.Fide]: 0,
        [RatingSystem.Uscf]: 350,
        [RatingSystem.Ecf]: 400,
        [RatingSystem.Cfc]: 350,
        [RatingSystem.Dwz]: 450,
        [RatingSystem.Acf]: 300,
        [RatingSystem.Knsb]: 400,
        [RatingSystem.Custom]: -1,
        [RatingSystem.Custom2]: -1,
        [RatingSystem.Custom3]: -1,
    },
    '300-400': {
        [RatingSystem.Chesscom]: 650,
        [RatingSystem.Lichess]: 1310,
        [RatingSystem.Fide]: 0,
        [RatingSystem.Uscf]: 460,
        [RatingSystem.Ecf]: 625,
        [RatingSystem.Cfc]: 460,
        [RatingSystem.Dwz]: 540,
        [RatingSystem.Acf]: 395,
        [RatingSystem.Knsb]: 600,
        [RatingSystem.Custom]: -1,
        [RatingSystem.Custom2]: -1,
        [RatingSystem.Custom3]: -1,
    },
    '400-500': {
        [RatingSystem.Chesscom]: 750,
        [RatingSystem.Lichess]: 1370,
        [RatingSystem.Fide]: 0,
        [RatingSystem.Uscf]: 570,
        [RatingSystem.Ecf]: 850,
        [RatingSystem.Cfc]: 570,
        [RatingSystem.Dwz]: 630,
        [RatingSystem.Acf]: 490,
        [RatingSystem.Knsb]: 800,
        [RatingSystem.Custom]: -1,
        [RatingSystem.Custom2]: -1,
        [RatingSystem.Custom3]: -1,
    },
    '500-600': {
        [RatingSystem.Chesscom]: 850,
        [RatingSystem.Lichess]: 1435,
        [RatingSystem.Fide]: 0,
        [RatingSystem.Uscf]: 680,
        [RatingSystem.Ecf]: 1000,
        [RatingSystem.Cfc]: 680,
        [RatingSystem.Dwz]: 725,
        [RatingSystem.Acf]: 585,
        [RatingSystem.Knsb]: 1000,
        [RatingSystem.Custom]: -1,
        [RatingSystem.Custom2]: -1,
        [RatingSystem.Custom3]: -1,
    },
    '600-700': {
        [RatingSystem.Chesscom]: 950,
        [RatingSystem.Lichess]: 1500,
        [RatingSystem.Fide]: 0,
        [RatingSystem.Uscf]: 790,
        [RatingSystem.Ecf]: 1130,
        [RatingSystem.Cfc]: 780,
        [RatingSystem.Dwz]: 815,
        [RatingSystem.Acf]: 680,
        [RatingSystem.Knsb]: 1140,
        [RatingSystem.Custom]: -1,
        [RatingSystem.Custom2]: -1,
        [RatingSystem.Custom3]: -1,
    },
    '700-800': {
        [RatingSystem.Chesscom]: 1050,
        [RatingSystem.Lichess]: 1550,
        [RatingSystem.Fide]: 0,
        [RatingSystem.Uscf]: 900,
        [RatingSystem.Ecf]: 1210,
        [RatingSystem.Cfc]: 880,
        [RatingSystem.Dwz]: 920,
        [RatingSystem.Acf]: 775,
        [RatingSystem.Knsb]: 1280,
        [RatingSystem.Custom]: -1,
        [RatingSystem.Custom2]: -1,
        [RatingSystem.Custom3]: -1,
    },
    '800-900': {
        [RatingSystem.Chesscom]: 1150,
        [RatingSystem.Lichess]: 1600,
        [RatingSystem.Fide]: 0,
        [RatingSystem.Uscf]: 1010,
        [RatingSystem.Ecf]: 1270,
        [RatingSystem.Cfc]: 980,
        [RatingSystem.Dwz]: 1025,
        [RatingSystem.Acf]: 870,
        [RatingSystem.Knsb]: 1400,
        [RatingSystem.Custom]: -1,
        [RatingSystem.Custom2]: -1,
        [RatingSystem.Custom3]: -1,
    },
    '900-1000': {
        [RatingSystem.Fide]: 1450,
        [RatingSystem.Uscf]: 1120,
        [RatingSystem.Chesscom]: 1250,
        [RatingSystem.Lichess]: 1665,
        [RatingSystem.Ecf]: 1325,
        [RatingSystem.Cfc]: 1090,
        [RatingSystem.Dwz]: 1110,
        [RatingSystem.Acf]: 990,
        [RatingSystem.Knsb]: 1450,
        [RatingSystem.Custom]: -1,
        [RatingSystem.Custom2]: -1,
        [RatingSystem.Custom3]: -1,
    },
    '1000-1100': {
        [RatingSystem.Fide]: 1500,
        [RatingSystem.Uscf]: 1230,
        [RatingSystem.Chesscom]: 1350,
        [RatingSystem.Lichess]: 1730,
        [RatingSystem.Ecf]: 1390,
        [RatingSystem.Cfc]: 1200,
        [RatingSystem.Dwz]: 1185,
        [RatingSystem.Acf]: 1100,
        [RatingSystem.Knsb]: 1500,
        [RatingSystem.Custom]: -1,
        [RatingSystem.Custom2]: -1,
        [RatingSystem.Custom3]: -1,
    },
    '1100-1200': {
        [RatingSystem.Fide]: 1550,
        [RatingSystem.Uscf]: 1330,
        [RatingSystem.Chesscom]: 1450,
        [RatingSystem.Lichess]: 1795,
        [RatingSystem.Ecf]: 1455,
        [RatingSystem.Cfc]: 1300,
        [RatingSystem.Dwz]: 1260,
        [RatingSystem.Acf]: 1210,
        [RatingSystem.Knsb]: 1550,
        [RatingSystem.Custom]: -1,
        [RatingSystem.Custom2]: -1,
        [RatingSystem.Custom3]: -1,
    },
    '1200-1300': {
        [RatingSystem.Fide]: 1600,
        [RatingSystem.Uscf]: 1420,
        [RatingSystem.Chesscom]: 1550,
        [RatingSystem.Lichess]: 1850,
        [RatingSystem.Ecf]: 1535,
        [RatingSystem.Cfc]: 1390,
        [RatingSystem.Dwz]: 1335,
        [RatingSystem.Acf]: 1320,
        [RatingSystem.Knsb]: 1600,
        [RatingSystem.Custom]: -1,
        [RatingSystem.Custom2]: -1,
        [RatingSystem.Custom3]: -1,
    },
    '1300-1400': {
        [RatingSystem.Fide]: 1650,
        [RatingSystem.Uscf]: 1510,
        [RatingSystem.Chesscom]: 1650,
        [RatingSystem.Lichess]: 1910,
        [RatingSystem.Ecf]: 1595,
        [RatingSystem.Cfc]: 1480,
        [RatingSystem.Dwz]: 1410,
        [RatingSystem.Acf]: 1415,
        [RatingSystem.Knsb]: 1650,
        [RatingSystem.Custom]: -1,
        [RatingSystem.Custom2]: -1,
        [RatingSystem.Custom3]: -1,
    },
    '1400-1500': {
        [RatingSystem.Fide]: 1700,
        [RatingSystem.Uscf]: 1600,
        [RatingSystem.Chesscom]: 1750,
        [RatingSystem.Lichess]: 1970,
        [RatingSystem.Ecf]: 1665,
        [RatingSystem.Cfc]: 1570,
        [RatingSystem.Dwz]: 1480,
        [RatingSystem.Acf]: 1510,
        [RatingSystem.Knsb]: 1700,
        [RatingSystem.Custom]: -1,
        [RatingSystem.Custom2]: -1,
        [RatingSystem.Custom3]: -1,
    },
    '1500-1600': {
        [RatingSystem.Fide]: 1750,
        [RatingSystem.Uscf]: 1675,
        [RatingSystem.Chesscom]: 1850,
        [RatingSystem.Lichess]: 2030,
        [RatingSystem.Ecf]: 1735,
        [RatingSystem.Cfc]: 1645,
        [RatingSystem.Dwz]: 1560,
        [RatingSystem.Acf]: 1605,
        [RatingSystem.Knsb]: 1750,
        [RatingSystem.Custom]: -1,
        [RatingSystem.Custom2]: -1,
        [RatingSystem.Custom3]: -1,
    },
    '1600-1700': {
        [RatingSystem.Fide]: 1800,
        [RatingSystem.Uscf]: 1750,
        [RatingSystem.Chesscom]: 1950,
        [RatingSystem.Lichess]: 2090,
        [RatingSystem.Ecf]: 1805,
        [RatingSystem.Cfc]: 1730,
        [RatingSystem.Dwz]: 1640,
        [RatingSystem.Acf]: 1700,
        [RatingSystem.Knsb]: 1800,
        [RatingSystem.Custom]: -1,
        [RatingSystem.Custom2]: -1,
        [RatingSystem.Custom3]: -1,
    },
    '1700-1800': {
        [RatingSystem.Fide]: 1850,
        [RatingSystem.Uscf]: 1825,
        [RatingSystem.Chesscom]: 2050,
        [RatingSystem.Lichess]: 2150,
        [RatingSystem.Ecf]: 1875,
        [RatingSystem.Cfc]: 1825,
        [RatingSystem.Dwz]: 1720,
        [RatingSystem.Acf]: 1790,
        [RatingSystem.Knsb]: 1850,
        [RatingSystem.Custom]: -1,
        [RatingSystem.Custom2]: -1,
        [RatingSystem.Custom3]: -1,
    },
    '1800-1900': {
        [RatingSystem.Fide]: 1910,
        [RatingSystem.Uscf]: 1930,
        [RatingSystem.Chesscom]: 2165,
        [RatingSystem.Lichess]: 2225,
        [RatingSystem.Ecf]: 1955,
        [RatingSystem.Cfc]: 1925,
        [RatingSystem.Dwz]: 1815,
        [RatingSystem.Acf]: 1900,
        [RatingSystem.Knsb]: 1910,
        [RatingSystem.Custom]: -1,
        [RatingSystem.Custom2]: -1,
        [RatingSystem.Custom3]: -1,
    },
    '1900-2000': {
        [RatingSystem.Fide]: 2000,
        [RatingSystem.Uscf]: 2055,
        [RatingSystem.Chesscom]: 2275,
        [RatingSystem.Lichess]: 2310,
        [RatingSystem.Ecf]: 2065,
        [RatingSystem.Cfc]: 2060,
        [RatingSystem.Dwz]: 1940,
        [RatingSystem.Acf]: 2000,
        [RatingSystem.Knsb]: 2000,
        [RatingSystem.Custom]: -1,
        [RatingSystem.Custom2]: -1,
        [RatingSystem.Custom3]: -1,
    },
    '2000-2100': {
        [RatingSystem.Fide]: 2100,
        [RatingSystem.Uscf]: 2185,
        [RatingSystem.Chesscom]: 2360,
        [RatingSystem.Lichess]: 2370,
        [RatingSystem.Ecf]: 2165,
        [RatingSystem.Cfc]: 2185,
        [RatingSystem.Dwz]: 2070,
        [RatingSystem.Acf]: 2105,
        [RatingSystem.Knsb]: 2100,
        [RatingSystem.Custom]: -1,
        [RatingSystem.Custom2]: -1,
        [RatingSystem.Custom3]: -1,
    },
    '2100-2200': {
        [RatingSystem.Fide]: 2200,
        [RatingSystem.Uscf]: 2290,
        [RatingSystem.Chesscom]: 2425,
        [RatingSystem.Lichess]: 2410,
        [RatingSystem.Ecf]: 2260,
        [RatingSystem.Cfc]: 2290,
        [RatingSystem.Dwz]: 2185,
        [RatingSystem.Acf]: 2215,
        [RatingSystem.Knsb]: 2200,
        [RatingSystem.Custom]: -1,
        [RatingSystem.Custom2]: -1,
        [RatingSystem.Custom3]: -1,
    },
    '2200-2300': {
        [RatingSystem.Fide]: 2300,
        [RatingSystem.Uscf]: 2395,
        [RatingSystem.Chesscom]: 2485,
        [RatingSystem.Lichess]: 2440,
        [RatingSystem.Ecf]: 2360,
        [RatingSystem.Cfc]: 2395,
        [RatingSystem.Dwz]: 2285,
        [RatingSystem.Acf]: 2330,
        [RatingSystem.Knsb]: 2300,
        [RatingSystem.Custom]: -1,
        [RatingSystem.Custom2]: -1,
        [RatingSystem.Custom3]: -1,
    },
    '2300-2400': {
        [RatingSystem.Fide]: 2400,
        [RatingSystem.Uscf]: 2500,
        [RatingSystem.Chesscom]: 2550,
        [RatingSystem.Lichess]: 2470,
        [RatingSystem.Ecf]: 2460,
        [RatingSystem.Cfc]: 2500,
        [RatingSystem.Dwz]: 2385,
        [RatingSystem.Acf]: 2450,
        [RatingSystem.Knsb]: 2400,
        [RatingSystem.Custom]: -1,
        [RatingSystem.Custom2]: -1,
        [RatingSystem.Custom3]: -1,
    },
};

export function getRatingBoundary(
    cohort: string,
    ratingSystem: RatingSystem,
    boundaries: Record<string, Record<RatingSystem, number>> = ratingBoundaries,
): number | undefined {
    const cohortBoundaries = boundaries[cohort];
    if (!cohortBoundaries) {
        return undefined;
    }

    const boundary = cohortBoundaries[ratingSystem];
    if (boundary <= 0) {
        return undefined;
    }
    return boundary;
}

/**
 * Returns the minimum rating for the given cohort and rating system.
 * @param cohort The cohort to get the minimum rating for.
 * @param ratingSystem The rating system to get the minimum rating for.
 * @returns The minimum rating for the given cohort and rating system.
 */
export function getMinRatingBoundary(
    cohort: string,
    ratingSystem: RatingSystem,
    boundaries: Record<string, Record<RatingSystem, number>> = ratingBoundaries,
): number {
    const cohortIdx = dojoCohorts.findIndex((c) => c === cohort);
    if (cohortIdx <= 0) {
        return 0;
    }
    return getRatingBoundary(dojoCohorts[cohortIdx - 1], ratingSystem, boundaries) || 0;
}

export function getNormalizedRating(
    rating: number,
    ratingSystem: RatingSystem,
    boundaries: Record<string, Record<RatingSystem, number>> = ratingBoundaries,
): number {
    if (isCustom(ratingSystem)) {
        return -1;
    }

    for (const cohort of dojoCohorts) {
        const x2 = getRatingBoundary(cohort, ratingSystem, boundaries);
        if (!x2) {
            continue;
        }

        if (x2 >= rating) {
            const x1 = getMinRatingBoundary(cohort, ratingSystem, boundaries);

            let [y1, y2] = getCohortRangeInt(cohort);

            if (y1 === -1) {
                y1 = 0;
            }
            if (y2 === -1) {
                y2 = 0;
            }

            const result = ((y2 - y1) / (x2 - x1)) * (rating - x1) + y1;
            return Math.round(result * 10) / 10;
        }
    }

    // We are in the 2400+ cohort if we make it here, so we just extrapolate from the 2300-2400 line
    const x1 = getMinRatingBoundary('2300-2400', ratingSystem, boundaries);
    const x2 = getRatingBoundary('2300-2400', ratingSystem, boundaries) || 0;
    const y1 = 2300;
    const y2 = 2400;
    const result = ((y2 - y1) / (x2 - x1)) * (rating - x1) + y1;
    return Math.round(result * 10) / 10;
}

export function shouldPromptGraduation(user?: User): boolean {
    if (!user?.dojoCohort || !user.ratingSystem) {
        return false;
    }
    if (isCustom(user.ratingSystem)) {
        return false;
    }
    const cohortBoundaries = ratingBoundaries[user.dojoCohort];
    if (!cohortBoundaries) {
        return false;
    }

    const ratingBoundary = cohortBoundaries[user.ratingSystem];
    if (!ratingBoundary) {
        return false;
    }

    return getCurrentRating(user) >= ratingBoundary;
}

const THREE_MONTHS = 1000 * 60 * 60 * 24 * 90;

/**
 * Returns whether the user should be prompted to demote themselves. Demotion is currently prompted when
 * they are 25 points or more below their current cohort for 90 days.
 * @param user The user to potentially prompt for demotion.
 * @returns True if the user should be prompted to demote.
 */
export function shouldPromptDemotion(user?: User): boolean {
    if (!user?.dojoCohort || !user.ratingSystem) {
        return false;
    }
    if (isCustom(user.ratingSystem)) {
        return false;
    }

    const minRating = getMinRatingBoundary(user.dojoCohort, user.ratingSystem) - 25;
    if (getCurrentRating(user) >= minRating) {
        return false;
    }

    const history = user.ratingHistories?.[user.ratingSystem];
    if (!history) {
        return false;
    }

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setTime(new Date().getTime() - THREE_MONTHS);
    const threeMonthsAgoStr = threeMonthsAgo.toISOString();

    let haveFullHistory = false;
    for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].date >= threeMonthsAgoStr && history[i].rating >= minRating) {
            return false;
        }
        if (history[i].date < threeMonthsAgoStr) {
            haveFullHistory = true;
            break;
        }
    }
    return haveFullHistory;
}

export function hasCreatedProfile(user?: User): boolean {
    if (
        !user ||
        user.dojoCohort === '' ||
        user.dojoCohort === 'NO_COHORT' ||
        user.displayName.trim() === '' ||
        (user.ratingSystem as string) === '' ||
        !user.hasCreatedProfile
    ) {
        return false;
    }
    return dojoCohorts.includes(user.dojoCohort);
}

export function isActive(user: User): boolean {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 31);

    return user.updatedAt >= monthAgo.toISOString();
}

/**
 * Returns true if the given user is on the free tier.
 * @param user The user to check
 */
export function isFree(user: User | undefined): boolean {
    return user?.subscriptionStatus !== SubscriptionStatus.Subscribed;
}
