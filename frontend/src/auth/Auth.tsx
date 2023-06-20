import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { CognitoHostedUIIdentityProvider } from '@aws-amplify/auth';
import { Auth as AmplifyAuth } from 'aws-amplify';
import { v4 as uuidv4 } from 'uuid';

import {
    CognitoUser,
    hasCreatedProfile,
    parseCognitoResponse,
    parseUser,
    User,
} from '../database/user';
import { getUser } from '../api/userApi';
import LoadingPage from '../loading/LoadingPage';
import { useApi } from '../api/Api';
import { useRequest } from '../api/Request';
import ForbiddenPage from './ForbiddenPage';
import ProfileCreatorPage from '../profile/creator/ProfileCreatorPage';
import { EventType, trackEvent, setUser as setAnalyticsUser } from '../analytics/events';

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
    trackEvent(EventType.Login, { method: 'Google' });
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
    trackEvent(EventType.Signup);
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
    trackEvent(EventType.SignupConfirm);
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
    trackEvent(EventType.ForgotPassword);
    return AmplifyAuth.forgotPassword(email);
}

function forgotPasswordConfirm(email: string, code: string, password: string) {
    trackEvent(EventType.ForgotPasswordConfirm);
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
        const cognitoUser = parseCognitoResponse(cognitoResponse);
        const apiResponse = await fetchUser(cognitoUser);
        const user = parseUser(apiResponse.data, cognitoUser);
        console.log('Got user: ', user);
        setUser(user);
        setStatus(AuthStatus.Authenticated);
        setAnalyticsUser(user);
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
            setUser({ ...user, ...update });
        }
    };

    const signin = (email: string, password: string) => {
        return new Promise<void>(async (resolve, reject) => {
            try {
                console.log('Signing in');
                const cognitoResponse = await AmplifyAuth.signIn(email, password);
                trackEvent(EventType.Login, { method: 'Cognito' });
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
            trackEvent(EventType.Logout);
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
 * A React component that renders an Outlet only if the current user is signed in and has a completed profile.
 * If the user is not signed in, then they are redirected to the landing page. If the user is signed in, but
 * has not completed their profile, the profile editor page is rendered regardless of the current route.
 */
export function RequireAuth() {
    const auth = useAuth();
    const user = auth.user;
    const api = useApi();
    const request = useRequest();

    useEffect(() => {
        if (auth.status === AuthStatus.Authenticated && !request.isSent()) {
            request.onStart();
            console.log('Checking user access');
            api.checkUserAccess()
                .then(() => {
                    request.onSuccess();
                    auth.updateUser({ isForbidden: false });
                })
                .catch((err) => {
                    console.log('Check user access error: ', err.response);
                    request.onFailure(err);
                    if (err.response?.status === 403) {
                        auth.updateUser({ isForbidden: true });
                    }
                });
        }
    }, [auth, request, api]);

    if (auth.status === AuthStatus.Loading) {
        return <LoadingPage />;
    }

    if (auth.status === AuthStatus.Unauthenticated || !user) {
        return <Navigate to='/' replace />;
    }

    if (user.isForbidden) {
        return <ForbiddenPage />;
    }

    if (!hasCreatedProfile(user)) {
        return <ProfileCreatorPage />;
    }

    return <Outlet />;
}
