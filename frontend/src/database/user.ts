import { RequirementProgress } from './requirement';

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

export interface User {
    cognitoUser?: CognitoUser;

    username: string;
    discordUsername: string;
    dojoCohort: string;

    chesscomUsername: string;
    lichessUsername: string;
    fideId: string;
    uscfId: string;

    ratingSystem: 'chesscom' | 'lichess' | 'fide' | 'uscf';

    startChesscomRating: number;
    currentChesscomRating: number;

    startLichessRating: number;
    currentLichessRating: number;

    startFideRating: number;
    currentFideRating: number;

    startUscfRating: number;
    currentUscfRating: number;

    progress: { [requirementId: string]: RequirementProgress };
    disableBookingNotifications: boolean;
    disableCancellationNotifications: boolean;
    isAdmin: boolean;
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
