import { CognitoHostedUIIdentityProvider } from '@aws-amplify/auth';
import { Auth as AmplifyAuth } from 'aws-amplify';
import { AxiosError, AxiosResponse } from 'axios';
import {
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { EventType, setUser as setAnalyticsUser, trackEvent } from '../analytics/events';
import { useApi } from '../api/Api';
import { useRequest } from '../api/Request';
import { syncPurchases } from '../api/paymentApi';
import { getUser } from '../api/userApi';
import {
    clearCheckoutSessionIds,
    getAllCheckoutSessionIds,
} from '../courses/localStorage';
import {
    CognitoResponse,
    SubscriptionStatus,
    User,
    hasCreatedProfile,
    parseCognitoResponse,
    parseUser,
} from '../database/user';
import LoadingPage from '../loading/LoadingPage';
import ProfileCreatorPage from '../profile/creator/ProfileCreatorPage';

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

    socialSignin: (provider: string, redirectUri: string) => void;
    signin: (email: string, password: string) => Promise<void>;

    signup: (
        name: string,
        email: string,
        password: string,
    ) => Promise<{ user: { getUsername: () => string } }>;
    confirmSignup: (username: string, code: string) => Promise<void>;
    resendSignupCode: (username: string) => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;
    forgotPasswordConfirm: (
        email: string,
        code: string,
        password: string,
    ) => Promise<string>;

    signout: () => void;
}

interface RequiredAuthContextType extends AuthContextType {
    user: User;
    status: AuthStatus.Authenticated;
}

const defaultAuthContextFunction = () => {
    throw new Error('Using the default AuthContext is prohibited');
};

const AuthContext = createContext<AuthContextType>({
    status: AuthStatus.Unauthenticated,
    getCurrentUser: defaultAuthContextFunction,
    updateUser: defaultAuthContextFunction,
    socialSignin: defaultAuthContextFunction,
    signin: defaultAuthContextFunction,
    signup: defaultAuthContextFunction,
    confirmSignup: defaultAuthContextFunction,
    resendSignupCode: defaultAuthContextFunction,
    forgotPassword: defaultAuthContextFunction,
    forgotPasswordConfirm: defaultAuthContextFunction,
    signout: defaultAuthContextFunction,
});

function socialSignin(provider: string, redirectUri: string) {
    trackEvent(EventType.Login, { method: 'Google' });
    AmplifyAuth.federatedSignIn({
        provider: provider as CognitoHostedUIIdentityProvider,
        customState: redirectUri,
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
    }).catch((err: Error) => {
        if (
            (err as { code?: string }).code !== 'NotAuthorizedException' ||
            !err.message?.includes('Current status is CONFIRMED')
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

export function useRequiredAuth(): RequiredAuthContextType {
    const context = useContext(AuthContext);
    if (!context.user || context.status !== AuthStatus.Authenticated) {
        throw new Error(
            'useRequiredAuth should only be called in components that the user is required to be logged in to view.',
        );
    }
    return context as RequiredAuthContextType;
}

export function useFreeTier() {
    return useAuth().user?.subscriptionStatus !== SubscriptionStatus.Subscribed;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User>();
    const [status, setStatus] = useState<AuthStatus>(AuthStatus.Loading);

    const handleCognitoResponse = useCallback(
        async (cognitoResponse: CognitoResponse) => {
            const cognitoUser = parseCognitoResponse(cognitoResponse);
            const checkoutSessionIds = getAllCheckoutSessionIds();
            let apiResponse: AxiosResponse<User>;

            if (Object.values(checkoutSessionIds).length > 0) {
                apiResponse = await syncPurchases(
                    cognitoUser.session.idToken.jwtToken,
                    checkoutSessionIds,
                );
                clearCheckoutSessionIds();
            } else {
                apiResponse = await getUser(cognitoUser.session.idToken.jwtToken);
            }

            const user = parseUser(apiResponse.data, cognitoUser);
            console.log('Got user: ', user);
            setUser(user);
            setStatus(AuthStatus.Authenticated);
            setAnalyticsUser(user);
        },
        [],
    );

    const getCurrentUser = useCallback(async () => {
        try {
            const cognitoResponse = (await AmplifyAuth.currentAuthenticatedUser({
                bypassCache: true,
            })) as CognitoResponse;
            await handleCognitoResponse(cognitoResponse);
        } catch (err) {
            console.error('Failed to get user: ', err);
            setStatus(AuthStatus.Unauthenticated);
        }
    }, [handleCognitoResponse]);

    useEffect(() => {
        void getCurrentUser();
    }, [getCurrentUser]);

    const updateUser = (update: Partial<User>) => {
        if (user) {
            setUser({ ...user, ...update });
        }
    };

    const signin = (email: string, password: string) => {
        return new Promise<void>((resolve, reject) => {
            void (async () => {
                try {
                    console.log('Signing in');
                    const cognitoResponse = (await AmplifyAuth.signIn(
                        email,
                        password,
                    )) as CognitoResponse;
                    trackEvent(EventType.Login, { method: 'Cognito' });
                    await handleCognitoResponse(cognitoResponse);
                    resolve();
                } catch (err) {
                    console.error('Failed Auth.signIn: ', err);
                    setStatus(AuthStatus.Unauthenticated);
                    reject(err as Error);
                }
            })();
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
    const location = useLocation();

    useEffect(() => {
        if (auth.status === AuthStatus.Authenticated && !request.isSent()) {
            request.onStart();
            console.log('Checking user access');
            api.checkUserAccess()
                .then(() => {
                    request.onSuccess();
                    auth.updateUser({
                        subscriptionStatus: SubscriptionStatus.Subscribed,
                    });
                })
                .catch((err: AxiosError) => {
                    console.log('Check user access error: ', err);
                    request.onFailure(err);
                    if (err.response?.status === 403) {
                        auth.updateUser({
                            subscriptionStatus: SubscriptionStatus.FreeTier,
                        });
                    }
                });
        }
    }, [auth, request, api]);

    if (auth.status === AuthStatus.Loading) {
        return <LoadingPage />;
    }

    if (auth.status === AuthStatus.Unauthenticated || !user) {
        return (
            <Navigate
                to='/'
                replace
                state={{ redirectUri: `${location.pathname}${location.search}` }}
            />
        );
    }

    if (!hasCreatedProfile(user)) {
        return <ProfileCreatorPage />;
    }

    return <Outlet />;
}
