import { RequirementProgress, TimelineEntry } from './requirement';

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
}

export function formatRatingSystem(ratingSystem: RatingSystem): string {
    switch (ratingSystem) {
        case RatingSystem.Chesscom:
            return 'Chess.com Rapid';
        case RatingSystem.Lichess:
            return 'Lichess Classical';
        case RatingSystem.Fide:
            return 'FIDE';
        case RatingSystem.Uscf:
            return 'USCF';
    }
}

export interface User {
    cognitoUser?: CognitoUser;

    username: string;
    discordUsername: string;
    dojoCohort: string;
    bio: string;

    chesscomUsername: string;
    lichessUsername: string;
    fideId: string;
    uscfId: string;

    ratingSystem: RatingSystem;

    startChesscomRating: number;
    currentChesscomRating: number;

    startLichessRating: number;
    currentLichessRating: number;

    startFideRating: number;
    currentFideRating: number;

    startUscfRating: number;
    currentUscfRating: number;

    progress: { [requirementId: string]: RequirementProgress };
    timeline: TimelineEntry[];
    disableBookingNotifications: boolean;
    disableCancellationNotifications: boolean;
    isAdmin: boolean;
    createdAt: string;
    numberOfGraduations: number;
    previousCohort: string;
    lastGraduatedAt: string;
}

export function parseUser(apiResponse: any, cognitoUser?: CognitoUser) {
    return {
        ...apiResponse,
        cognitoUser,
    };
}

export function getCurrentRating(user?: User): number {
    if (!user) {
        return 0;
    }

    switch (user.ratingSystem) {
        case RatingSystem.Chesscom:
            return user.currentChesscomRating;
        case RatingSystem.Lichess:
            return user.currentLichessRating;
        case RatingSystem.Fide:
            return user.currentFideRating;
        case RatingSystem.Uscf:
            return user.currentUscfRating;

        default:
            return 0;
    }
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
    },
    '300-400': {
        [RatingSystem.Chesscom]: 650,
        [RatingSystem.Lichess]: 1100,
        [RatingSystem.Fide]: 400,
        [RatingSystem.Uscf]: 450,
    },
    '400-500': {
        [RatingSystem.Chesscom]: 750,
        [RatingSystem.Lichess]: 1165,
        [RatingSystem.Fide]: 500,
        [RatingSystem.Uscf]: 550,
    },
    '500-600': {
        [RatingSystem.Chesscom]: 850,
        [RatingSystem.Lichess]: 1225,
        [RatingSystem.Fide]: 600,
        [RatingSystem.Uscf]: 650,
    },
    '600-700': {
        [RatingSystem.Chesscom]: 950,
        [RatingSystem.Lichess]: 1290,
        [RatingSystem.Fide]: 700,
        [RatingSystem.Uscf]: 750,
    },
    '700-800': {
        [RatingSystem.Chesscom]: 1050,
        [RatingSystem.Lichess]: 1350,
        [RatingSystem.Fide]: 800,
        [RatingSystem.Uscf]: 850,
    },
    '800-900': {
        [RatingSystem.Chesscom]: 1150,
        [RatingSystem.Lichess]: 1415,
        [RatingSystem.Fide]: 900,
        [RatingSystem.Uscf]: 950,
    },
    '900-1000': {
        [RatingSystem.Fide]: 1000,
        [RatingSystem.Uscf]: 1050,
        [RatingSystem.Chesscom]: 1250,
        [RatingSystem.Lichess]: 1475,
    },
    '1000-1100': {
        [RatingSystem.Fide]: 1100,
        [RatingSystem.Uscf]: 1150,
        [RatingSystem.Chesscom]: 1350,
        [RatingSystem.Lichess]: 1575,
    },
    '1100-1200': {
        [RatingSystem.Fide]: 1200,
        [RatingSystem.Uscf]: 1250,
        [RatingSystem.Chesscom]: 1450,
        [RatingSystem.Lichess]: 1675,
    },
    '1200-1300': {
        [RatingSystem.Fide]: 1300,
        [RatingSystem.Uscf]: 1350,
        [RatingSystem.Chesscom]: 1550,
        [RatingSystem.Lichess]: 1750,
    },
    '1300-1400': {
        [RatingSystem.Fide]: 1400,
        [RatingSystem.Uscf]: 1450,
        [RatingSystem.Chesscom]: 1650,
        [RatingSystem.Lichess]: 1825,
    },
    '1400-1500': {
        [RatingSystem.Fide]: 1500,
        [RatingSystem.Uscf]: 1550,
        [RatingSystem.Chesscom]: 1750,
        [RatingSystem.Lichess]: 1900,
    },
    '1500-1600': {
        [RatingSystem.Fide]: 1600,
        [RatingSystem.Uscf]: 1650,
        [RatingSystem.Chesscom]: 1850,
        [RatingSystem.Lichess]: 2000,
    },
    '1600-1700': {
        [RatingSystem.Fide]: 1700,
        [RatingSystem.Uscf]: 1775,
        [RatingSystem.Chesscom]: 1950,
        [RatingSystem.Lichess]: 2075,
    },
    '1700-1800': {
        [RatingSystem.Fide]: 1800,
        [RatingSystem.Uscf]: 1875,
        [RatingSystem.Chesscom]: 2050,
        [RatingSystem.Lichess]: 2150,
    },
    '1800-1900': {
        [RatingSystem.Fide]: 1900,
        [RatingSystem.Uscf]: 1975,
        [RatingSystem.Chesscom]: 2150,
        [RatingSystem.Lichess]: 2225,
    },
    '1900-2000': {
        [RatingSystem.Fide]: 2000,
        [RatingSystem.Uscf]: 2100,
        [RatingSystem.Chesscom]: 2250,
        [RatingSystem.Lichess]: 2300,
    },
    '2000-2100': {
        [RatingSystem.Fide]: 2100,
        [RatingSystem.Uscf]: 2200,
        [RatingSystem.Chesscom]: 2350,
        [RatingSystem.Lichess]: 2375,
    },
    '2100-2200': {
        [RatingSystem.Fide]: 2200,
        [RatingSystem.Uscf]: 2300,
        [RatingSystem.Chesscom]: 2425,
        [RatingSystem.Lichess]: 2450,
    },
    '2200-2300': {
        [RatingSystem.Fide]: 2300,
        [RatingSystem.Uscf]: 2400,
        [RatingSystem.Chesscom]: 2525,
        [RatingSystem.Lichess]: 2525,
    },
    '2300-2400': {
        [RatingSystem.Fide]: 2400,
        [RatingSystem.Uscf]: 2500,
        [RatingSystem.Chesscom]: 2600,
        [RatingSystem.Lichess]: 2600,
    },
};

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
