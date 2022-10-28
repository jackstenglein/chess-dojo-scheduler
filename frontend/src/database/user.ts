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

export function getInitials(name: string): string {
    if (name.length === 0) {
        return '';
    }

    let firstLetter = name.charAt(0).toUpperCase();
    let firstLetterIndex = 0;
    for (let i = 0; i < name.length; i++) {
        let letter = name.charAt(i);
        if (letter >= 'A' && letter <= 'Z') {
            firstLetter = letter;
            firstLetterIndex = i;
            break;
        }
    }

    let lastLetter = '';
    for (let i = name.length - 1; i > firstLetterIndex; i--) {
        let letter = name.charAt(i);
        if (letter >= 'A' && letter <= 'Z') {
            lastLetter = letter;
            break;
        }
    }

    return firstLetter + lastLetter;
}
