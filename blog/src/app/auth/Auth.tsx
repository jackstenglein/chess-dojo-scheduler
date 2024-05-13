'use client';

import { Amplify, Auth as AmplifyAuth } from 'aws-amplify';
import axios, { AxiosResponse } from 'axios';
import {
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import { getConfig } from '../config';
import { User, parseCognitoResponse, parseUser } from '../database/user';

const BASE_URL = getConfig().api.baseUrl;

const config = getConfig();
Amplify.configure({
    Auth: {
        region: config.auth.region,
        userPoolId: config.auth.userPoolId,
        userPoolWebClientId: config.auth.userPoolWebClientId,
        oauth: {
            domain: config.auth.oauth.domain,
            scope: config.auth.oauth.scope,
            redirectSignIn: config.auth.oauth.redirectSignIn,
            redirectSignOut: config.auth.oauth.redirectSignOut,
            responseType: config.auth.oauth.responseType,
        },
    },
});

/**
 * getUser returns the current signed-in user.
 * @param idToken The id token of the current signed-in user.
 * @returns An AxiosResponse containing the current user in the data field.
 */
function getUser(idToken: string) {
    return axios.get<User>(BASE_URL + '/user', {
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}

export enum AuthStatus {
    Loading = 'Loading',
    Authenticated = 'Authenticated',
    Unauthenticated = 'Unauthenticated',
}

interface AuthContextType {
    user?: User;
    status: AuthStatus;
    getCurrentUser: () => Promise<void>;
    signout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User>();
    const [status, setStatus] = useState<AuthStatus>(AuthStatus.Loading);

    const handleCognitoResponse = useCallback(async (cognitoResponse: any) => {
        const cognitoUser = parseCognitoResponse(cognitoResponse);
        let apiResponse: AxiosResponse<User>;

        apiResponse = await getUser(cognitoUser.session.idToken.jwtToken);
        const user = parseUser(apiResponse.data, cognitoUser);
        console.log('Got user: ', user);
        setUser(user);
        setStatus(AuthStatus.Authenticated);
    }, []);

    const getCurrentUser = useCallback(async () => {
        try {
            console.log('Getting current user');
            const cognitoResponse = await AmplifyAuth.currentAuthenticatedUser({
                bypassCache: true,
            });
            await handleCognitoResponse(cognitoResponse);
        } catch (err) {
            console.error('Failed to get user: ', err);
            setStatus(AuthStatus.Unauthenticated);
        }
    }, [handleCognitoResponse]);

    useEffect(() => {
        getCurrentUser();
    }, [getCurrentUser]);

    const signout = async () => {
        try {
            console.log('Signing out');
            await AmplifyAuth.signOut();
            console.log('Signed out');
            setUser(undefined);
            setStatus(AuthStatus.Unauthenticated);
        } catch (err) {
            console.error('Error signing out: ', err);
        }
    };

    const value = {
        user,
        status,
        getCurrentUser,
        signout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
