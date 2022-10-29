interface CognitoSession {
    idToken: {
        jwtToken: string;
    };
    refreshToken: {
        token: string;
    };
}

export class CognitoUser {
    constructor(
        readonly session: CognitoSession,
        readonly username: string,
        readonly rawResponse: any
    ) {}

    static from(cognitoResponse: any) {
        return new this(
            cognitoResponse.signInUserSession,
            cognitoResponse.username,
            cognitoResponse
        );
    }

    /**
     * withSession returns a copy of this CognitoUser with the provided CognitoSession. This function
     * can be used to get an updated version of this user without modifying state.
     */
    withSession(session?: CognitoSession): CognitoUser {
        if (!session) {
            return this;
        }
        return new CognitoUser(session, this.username, this.rawResponse);
    }
}

export type UserUpdate = Partial<User> & {
    session?: CognitoSession;
};

export class User {
    constructor(
        readonly cognitoUser: CognitoUser | undefined,
        readonly username: string,

        public discordUsername: string,
        public chesscomUsername: string,
        public lichessUsername: string,
        public dojoCohort: string
    ) {}

    static from(apiResponse: any, cognitoUser?: CognitoUser) {
        return new this(
            cognitoUser,
            apiResponse.username,
            apiResponse.discordUsername || '',
            apiResponse.chesscomUsername || '',
            apiResponse.lichessUsername || '',
            apiResponse.dojoCohort || ''
        );
    }

    /**
     * fromPartial returns a new User created from the provided Partial User object. Fields
     * missing from the Partial object are filled in with their empty values.
     * @param user The Partial object to use when initializing the user
     * @returns A new User object.
     */
    static fromPartial(user: Partial<User>): User {
        return new User(
            user.cognitoUser || undefined,
            user.username || '',
            user.discordUsername || '',
            user.chesscomUsername || '',
            user.lichessUsername || '',
            user.dojoCohort || ''
        );
    }

    /**
     * withSession returns a copy of this User with the provided CognitoSession. This function
     * can be used to get an updated version of this user without modifying state.
     */
    withSession(session: CognitoSession): User {
        return this.withUpdate({ session });
    }

    /**
     * withUpdate returns a copy of this User with the provided update made. This function can
     * be used to get an updated version of this user without modifying state.
     */
    withUpdate(update: UserUpdate): User {
        return new User(
            this.cognitoUser?.withSession(update.session),
            this.username,
            update.discordUsername || this.discordUsername,
            update.chesscomUsername || this.chesscomUsername,
            update.lichessUsername || this.lichessUsername,
            update.dojoCohort || this.dojoCohort
        );
    }
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
