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
    displayName: string;
    dojoCohort: string;
    ratingSystem: string;
    hasCreatedProfile: boolean;
}

export function parseUser(apiResponse: any, cognitoUser?: CognitoUser): User {
    return {
        ...apiResponse,
        cognitoUser,
    };
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
