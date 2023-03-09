import { Requirement, RequirementProgress } from './requirement';

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
    timeline: RequirementProgress[];
    disableBookingNotifications: boolean;
    disableCancellationNotifications: boolean;
    isAdmin: boolean;
    createdAt: string;
}

export function parseUser(apiResponse: any, cognitoUser?: CognitoUser) {
    return {
        ...apiResponse,
        cognitoUser,
    };
}

export const dojoCohorts: string[] = [
    '0-400',
    '400-600',
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

export function isRequirementComplete(
    user: User,
    requirement: Requirement,
    cohort: string
): boolean {
    const progress = user.progress[requirement.id];
    if (!progress) {
        return false;
    }

    const totalCount = requirement.counts[cohort] || requirement.counts[ALL_COHORTS];
    const currentCount = progress.counts[cohort] || progress.counts[ALL_COHORTS];
    return currentCount >= totalCount;
}
