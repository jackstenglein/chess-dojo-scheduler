import { CustomTask, RequirementProgress } from './requirement';

interface CognitoSession {
    idToken: {
        jwtToken: string;
    };
    refreshToken: {
        token: string;
    };
}

export interface CognitoUser {
    session: CognitoSession;
    username: string;
    rawResponse: any;
}

export function parseCognitoResponse(cognitoResponse: any) {
    return {
        session: cognitoResponse.signInUserSession,
        username: cognitoResponse.username,
        rawResponse: cognitoResponse,
    };
}

export enum RatingSystem {
    Chesscom = 'CHESSCOM',
    Lichess = 'LICHESS',
    Fide = 'FIDE',
    Uscf = 'USCF',
    Ecf = 'ECF',
    Cfc = 'CFC',
    Dwz = 'DWZ',
    Custom = 'CUSTOM',
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
        case RatingSystem.Custom:
            return 'Custom';
    }
    return ratingSystem;
}

export interface Rating {
    username: string;
    hideUsername: boolean;
    startRating: number;
    currentRating: number;
}

export interface RatingHistory {
    date: string;
    rating: number;
}

export interface User {
    cognitoUser?: CognitoUser;

    username: string;
    displayName: string;
    discordUsername: string;
    dojoCohort: string;
    bio: string;

    wixEmail: string;
    isForbidden: boolean;

    ratingSystem: RatingSystem;
    ratings: Partial<Record<RatingSystem, Rating>>;
    ratingHistories?: Record<RatingSystem, RatingHistory[]>;

    progress: { [requirementId: string]: RequirementProgress };
    disableBookingNotifications: boolean;
    disableCancellationNotifications: boolean;
    isAdmin: boolean;
    isCalendarAdmin: boolean;
    isBetaTester: boolean;
    createdAt: string;
    updatedAt: string;
    numberOfGraduations: number;
    previousCohort: string;
    graduationCohorts: string[];
    lastGraduatedAt: string;

    enableDarkMode: boolean;
    timezoneOverride: string;

    hasCreatedProfile: boolean;

    customTasks?: CustomTask[];

    openingProgress?: {
        [moduleId: string]: {
            exercises?: boolean[];
        };
    };

    tutorials?: Record<string, boolean>;
    minutesSpent?: Record<MinutesSpentKey, number>;
}

export type MinutesSpentKey =
    | 'LAST_7_DAYS'
    | 'LAST_30_DAYS'
    | 'LAST_90_DAYS'
    | 'LAST_365_DAYS';

export function parseUser(apiResponse: any, cognitoUser?: CognitoUser): User {
    return {
        ...apiResponse,
        cognitoUser,
    };
}

export function getStartRating(user?: User): number {
    if (!user) {
        return 0;
    }
    return getSystemStartRating(user, user.ratingSystem);
}

export function getSystemStartRating(
    user: User | undefined,
    ratingSystem: RatingSystem
): number {
    if (!user) {
        return 0;
    }
    const rating = user.ratings[ratingSystem];
    return rating?.startRating || 0;
}

export function getCurrentRating(user?: User): number {
    if (!user) {
        return 0;
    }
    return getSystemCurrentRating(user, user.ratingSystem);
}

export function getSystemCurrentRating(
    user: User | undefined,
    ratingSystem: RatingSystem
): number {
    if (!user) {
        return 0;
    }
    const rating = user.ratings[ratingSystem];
    return rating?.currentRating || 0;
}

export function getRatingUsername(
    user: User | undefined,
    ratingSystem: RatingSystem
): string {
    if (!user) {
        return '';
    }
    const rating = user.ratings[ratingSystem];
    return rating?.username || '';
}

export function hideRatingUsername(
    user: User | undefined,
    ratingSystem: RatingSystem
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

export function compareCohorts(a: string, b: string): number {
    const aInt = parseInt(a);
    const bInt = parseInt(b);
    if (aInt < bInt) {
        return -1;
    }
    return 1;
}

const ratingBoundaries: Record<string, Record<RatingSystem, number>> = {
    '0-300': {
        [RatingSystem.Chesscom]: 550,
        [RatingSystem.Lichess]: 1035,
        [RatingSystem.Fide]: 300,
        [RatingSystem.Uscf]: 350,
        [RatingSystem.Ecf]: 300,
        [RatingSystem.Cfc]: 425,
        [RatingSystem.Dwz]: 300,
        [RatingSystem.Custom]: -1,
    },
    '300-400': {
        [RatingSystem.Chesscom]: 650,
        [RatingSystem.Lichess]: 1100,
        [RatingSystem.Fide]: 400,
        [RatingSystem.Uscf]: 450,
        [RatingSystem.Ecf]: 400,
        [RatingSystem.Cfc]: 525,
        [RatingSystem.Dwz]: 400,
        [RatingSystem.Custom]: -1,
    },
    '400-500': {
        [RatingSystem.Chesscom]: 750,
        [RatingSystem.Lichess]: 1165,
        [RatingSystem.Fide]: 500,
        [RatingSystem.Uscf]: 550,
        [RatingSystem.Ecf]: 500,
        [RatingSystem.Cfc]: 625,
        [RatingSystem.Dwz]: 500,
        [RatingSystem.Custom]: -1,
    },
    '500-600': {
        [RatingSystem.Chesscom]: 850,
        [RatingSystem.Lichess]: 1225,
        [RatingSystem.Fide]: 600,
        [RatingSystem.Uscf]: 650,
        [RatingSystem.Ecf]: 600,
        [RatingSystem.Cfc]: 725,
        [RatingSystem.Dwz]: 600,
        [RatingSystem.Custom]: -1,
    },
    '600-700': {
        [RatingSystem.Chesscom]: 950,
        [RatingSystem.Lichess]: 1290,
        [RatingSystem.Fide]: 700,
        [RatingSystem.Uscf]: 750,
        [RatingSystem.Ecf]: 700,
        [RatingSystem.Cfc]: 825,
        [RatingSystem.Dwz]: 700,
        [RatingSystem.Custom]: -1,
    },
    '700-800': {
        [RatingSystem.Chesscom]: 1050,
        [RatingSystem.Lichess]: 1350,
        [RatingSystem.Fide]: 800,
        [RatingSystem.Uscf]: 850,
        [RatingSystem.Ecf]: 800,
        [RatingSystem.Cfc]: 925,
        [RatingSystem.Dwz]: 800,
        [RatingSystem.Custom]: -1,
    },
    '800-900': {
        [RatingSystem.Chesscom]: 1150,
        [RatingSystem.Lichess]: 1415,
        [RatingSystem.Fide]: 900,
        [RatingSystem.Uscf]: 950,
        [RatingSystem.Ecf]: 900,
        [RatingSystem.Cfc]: 1025,
        [RatingSystem.Dwz]: 900,
        [RatingSystem.Custom]: -1,
    },
    '900-1000': {
        [RatingSystem.Fide]: 1000,
        [RatingSystem.Uscf]: 1050,
        [RatingSystem.Chesscom]: 1250,
        [RatingSystem.Lichess]: 1475,
        [RatingSystem.Ecf]: 1000,
        [RatingSystem.Cfc]: 1125,
        [RatingSystem.Dwz]: 1000,
        [RatingSystem.Custom]: -1,
    },
    '1000-1100': {
        [RatingSystem.Fide]: 1100,
        [RatingSystem.Uscf]: 1150,
        [RatingSystem.Chesscom]: 1350,
        [RatingSystem.Lichess]: 1575,
        [RatingSystem.Ecf]: 1100,
        [RatingSystem.Cfc]: 1225,
        [RatingSystem.Dwz]: 1100,
        [RatingSystem.Custom]: -1,
    },
    '1100-1200': {
        [RatingSystem.Fide]: 1200,
        [RatingSystem.Uscf]: 1250,
        [RatingSystem.Chesscom]: 1450,
        [RatingSystem.Lichess]: 1675,
        [RatingSystem.Ecf]: 1200,
        [RatingSystem.Cfc]: 1325,
        [RatingSystem.Dwz]: 1200,
        [RatingSystem.Custom]: -1,
    },
    '1200-1300': {
        [RatingSystem.Fide]: 1300,
        [RatingSystem.Uscf]: 1350,
        [RatingSystem.Chesscom]: 1550,
        [RatingSystem.Lichess]: 1750,
        [RatingSystem.Ecf]: 1300,
        [RatingSystem.Cfc]: 1425,
        [RatingSystem.Dwz]: 1300,
        [RatingSystem.Custom]: -1,
    },
    '1300-1400': {
        [RatingSystem.Fide]: 1400,
        [RatingSystem.Uscf]: 1450,
        [RatingSystem.Chesscom]: 1650,
        [RatingSystem.Lichess]: 1825,
        [RatingSystem.Ecf]: 1400,
        [RatingSystem.Cfc]: 1525,
        [RatingSystem.Dwz]: 1400,
        [RatingSystem.Custom]: -1,
    },
    '1400-1500': {
        [RatingSystem.Fide]: 1500,
        [RatingSystem.Uscf]: 1550,
        [RatingSystem.Chesscom]: 1750,
        [RatingSystem.Lichess]: 1900,
        [RatingSystem.Ecf]: 1500,
        [RatingSystem.Cfc]: 1625,
        [RatingSystem.Dwz]: 1500,
        [RatingSystem.Custom]: -1,
    },
    '1500-1600': {
        [RatingSystem.Fide]: 1600,
        [RatingSystem.Uscf]: 1650,
        [RatingSystem.Chesscom]: 1850,
        [RatingSystem.Lichess]: 2000,
        [RatingSystem.Ecf]: 1600,
        [RatingSystem.Cfc]: 1725,
        [RatingSystem.Dwz]: 1600,
        [RatingSystem.Custom]: -1,
    },
    '1600-1700': {
        [RatingSystem.Fide]: 1700,
        [RatingSystem.Uscf]: 1775,
        [RatingSystem.Chesscom]: 1950,
        [RatingSystem.Lichess]: 2075,
        [RatingSystem.Ecf]: 1700,
        [RatingSystem.Cfc]: 1825,
        [RatingSystem.Dwz]: 1700,
        [RatingSystem.Custom]: -1,
    },
    '1700-1800': {
        [RatingSystem.Fide]: 1800,
        [RatingSystem.Uscf]: 1875,
        [RatingSystem.Chesscom]: 2050,
        [RatingSystem.Lichess]: 2150,
        [RatingSystem.Ecf]: 1800,
        [RatingSystem.Cfc]: 1925,
        [RatingSystem.Dwz]: 1800,
        [RatingSystem.Custom]: -1,
    },
    '1800-1900': {
        [RatingSystem.Fide]: 1900,
        [RatingSystem.Uscf]: 1975,
        [RatingSystem.Chesscom]: 2150,
        [RatingSystem.Lichess]: 2225,
        [RatingSystem.Ecf]: 1900,
        [RatingSystem.Cfc]: 2025,
        [RatingSystem.Dwz]: 1900,
        [RatingSystem.Custom]: -1,
    },
    '1900-2000': {
        [RatingSystem.Fide]: 2000,
        [RatingSystem.Uscf]: 2100,
        [RatingSystem.Chesscom]: 2250,
        [RatingSystem.Lichess]: 2300,
        [RatingSystem.Ecf]: 2000,
        [RatingSystem.Cfc]: 2125,
        [RatingSystem.Dwz]: 2000,
        [RatingSystem.Custom]: -1,
    },
    '2000-2100': {
        [RatingSystem.Fide]: 2100,
        [RatingSystem.Uscf]: 2200,
        [RatingSystem.Chesscom]: 2350,
        [RatingSystem.Lichess]: 2375,
        [RatingSystem.Ecf]: 2100,
        [RatingSystem.Cfc]: 2225,
        [RatingSystem.Dwz]: 2100,
        [RatingSystem.Custom]: -1,
    },
    '2100-2200': {
        [RatingSystem.Fide]: 2200,
        [RatingSystem.Uscf]: 2300,
        [RatingSystem.Chesscom]: 2425,
        [RatingSystem.Lichess]: 2450,
        [RatingSystem.Ecf]: 2200,
        [RatingSystem.Cfc]: 2325,
        [RatingSystem.Dwz]: 2200,
        [RatingSystem.Custom]: -1,
    },
    '2200-2300': {
        [RatingSystem.Fide]: 2300,
        [RatingSystem.Uscf]: 2400,
        [RatingSystem.Chesscom]: 2525,
        [RatingSystem.Lichess]: 2525,
        [RatingSystem.Ecf]: 2300,
        [RatingSystem.Cfc]: 2425,
        [RatingSystem.Dwz]: 2300,
        [RatingSystem.Custom]: -1,
    },
    '2300-2400': {
        [RatingSystem.Fide]: 2400,
        [RatingSystem.Uscf]: 2500,
        [RatingSystem.Chesscom]: 2600,
        [RatingSystem.Lichess]: 2600,
        [RatingSystem.Ecf]: 2400,
        [RatingSystem.Cfc]: 2525,
        [RatingSystem.Dwz]: 2400,
        [RatingSystem.Custom]: -1,
    },
};

export function getRatingBoundary(
    cohort: string,
    ratingSystem: RatingSystem
): number | undefined {
    const cohortBoundaries = ratingBoundaries[cohort];
    if (!cohortBoundaries) {
        return undefined;
    }

    const boundary = cohortBoundaries[ratingSystem];
    if (boundary <= 0) {
        return undefined;
    }
    return boundary;
}

export function getMinRatingBoundary(cohort: string, ratingSystem: RatingSystem): number {
    const cohortIdx = dojoCohorts.findIndex((c) => c === cohort);
    if (cohortIdx <= 0) {
        return 0;
    }
    return getRatingBoundary(dojoCohorts[cohortIdx - 1], ratingSystem) || 0;
}

export function normalizeToFide(rating: number, ratingSystem: RatingSystem): number {
    if (ratingSystem === RatingSystem.Fide) {
        return rating;
    }

    for (const cohort of dojoCohorts) {
        const x2 = getRatingBoundary(cohort, ratingSystem);
        if (!x2) {
            continue;
        }

        if (x2 >= rating) {
            const x1 = getMinRatingBoundary(cohort, ratingSystem);

            const y2 = getRatingBoundary(cohort, RatingSystem.Fide)!;
            const y1 = getMinRatingBoundary(cohort, RatingSystem.Fide);

            const result = ((y2 - y1) / (x2 - x1)) * (rating - x1) + y1;
            return Math.round(result * 10) / 10;
        }
    }

    // We are in the 2400+ cohort if we make it here, so we just extrapolate from the 2300-2400 line
    const x1 = getMinRatingBoundary('2300-2400', ratingSystem);
    const x2 = getRatingBoundary('2300-2400', ratingSystem)!;
    const y1 = 2300;
    const y2 = 2400;
    const result = ((y2 - y1) / (x2 - x1)) * (rating - x1) + y1;
    return Math.round(result * 10) / 10;
}

export function shouldPromptGraduation(user?: User): boolean {
    if (!user || !user.dojoCohort || !user.ratingSystem) {
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

export function hasCreatedProfile(user: User): boolean {
    if (
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
