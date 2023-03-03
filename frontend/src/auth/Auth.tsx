import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Auth as AmplifyAuth } from 'aws-amplify';
import { CognitoHostedUIIdentityProvider } from '@aws-amplify/auth';
import { v4 as uuidv4 } from 'uuid';

import { CognitoUser, User } from '../database/user';
import { getUser } from '../api/userApi';
import ProfilePage from '../profile/ProfilePage';
import LoadingPage from '../loading/LoadingPage';

export enum AuthStatus {
    Loading = 'Loading',
    Authenticated = 'Authenticated',
    Unauthenticated = 'Unauthenticated',
}

interface AuthContextType {
    user?: User;
    status: AuthStatus;

    getCurrentUser: () => Promise<void>;
    updateUser: (update: Partial<User>) => void;

    socialSignin: (provider: string) => void;
    signin: (email: string, password: string) => Promise<void>;

    signup: (name: string, email: string, password: string) => Promise<any>;
    confirmSignup: (username: string, code: string) => Promise<void>;
    resendSignupCode: (username: string) => Promise<any>;
    forgotPassword: (email: string) => Promise<void>;
    forgotPasswordConfirm: (
        email: string,
        code: string,
        password: string
    ) => Promise<string>;

    signout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

function socialSignin(provider: string) {
    AmplifyAuth.federatedSignIn({
        provider: provider as CognitoHostedUIIdentityProvider,
    })
        .then((value) => {
            console.log('Federated sign in value: ', value);
        })
        .catch((err) => {
            console.error('Federated sign in error: ', err);
        });
}

function signup(name: string, email: string, password: string) {
    return AmplifyAuth.signUp({
        username: uuidv4(),
        password,
        attributes: {
            email,
            name,
        },
    });
}

function confirmSignup(username: string, code: string) {
    return AmplifyAuth.confirmSignUp(username, code, {
        forceAliasCreation: false,
    }).catch((err) => {
        if (
            err.code !== 'NotAuthorizedException' ||
            !err.message.includes('Current status is CONFIRMED')
        ) {
            throw err;
        }
    });
}

function resendSignupCode(username: string) {
    return AmplifyAuth.resendSignUp(username);
}

function forgotPassword(email: string) {
    return AmplifyAuth.forgotPassword(email);
}

function forgotPasswordConfirm(email: string, code: string, password: string) {
    return AmplifyAuth.forgotPasswordSubmit(email, code, password);
}

export function useAuth() {
    return useContext(AuthContext);
}

async function fetchUser(cognitoUser: CognitoUser) {
    const apiResponse = await getUser(cognitoUser.session.idToken.jwtToken);
    return apiResponse;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User>();
    const [status, setStatus] = useState<AuthStatus>(AuthStatus.Loading);

    const handleCognitoResponse = useCallback(async (cognitoResponse: any) => {
        const cognitoUser = CognitoUser.from(cognitoResponse);
        const apiResponse = await fetchUser(cognitoUser);
        const user = User.from(apiResponse.data, cognitoUser);
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

    const updateUser = (update: Partial<User>) => {
        if (user) {
            setUser(user.withUpdate(update));
        }
    };

    const signin = (email: string, password: string) => {
        return new Promise<void>(async (resolve, reject) => {
            try {
                console.log('Signing in');
                const cognitoResponse = await AmplifyAuth.signIn(email, password);
                await handleCognitoResponse(cognitoResponse);
                resolve();
            } catch (err) {
                console.error('Failed Auth.signIn: ', err);
                setStatus(AuthStatus.Unauthenticated);
                reject(err);
            }
        });
    };

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
        updateUser,

        socialSignin,
        signin,

        signup,
        confirmSignup,
        resendSignupCode,
        forgotPassword,
        forgotPasswordConfirm,

        signout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * @returns A React component that renders an Outlet only if the current user is signed in.
 * Otherwise, the user is redirected to the landing page.
 */
export function RequireAuth() {
    const auth = useAuth();

    if (auth.status === AuthStatus.Loading) {
        return <LoadingPage />;
    }

    if (auth.status === AuthStatus.Unauthenticated || !auth.user) {
        return <Navigate to='/' replace />;
    }

    return <Outlet />;
}

/**
 * @returns A React component that renders an Outlet only if the current user is signed in and has a completed profile.
 * Otherwise, if the user is not signed in, they are redirected to the landing page, and if they are signed in
 * but don't have a completed profile, they are redirected to the profile page.
 */
export function RequireProfile() {
    const auth = useAuth();
    const user = auth.user;

    if (auth.status === AuthStatus.Unauthenticated || !user) {
        return <Navigate to='/' replace />;
    }

    if (
        user.dojoCohort === '' ||
        user.discordUsername === '' ||
        user.chesscomUsername === '' ||
        user.lichessUsername === ''
    ) {
        return <ProfilePage />;
    }

    return <Outlet />;
}
