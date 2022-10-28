import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from 'react';
import { useLocation, Navigate, Outlet } from 'react-router-dom';
import { Stack, CircularProgress } from '@mui/material';
import { Auth as AmplifyAuth } from 'aws-amplify';
import { CognitoHostedUIIdentityProvider } from '@aws-amplify/auth';

import { CognitoUser, User } from '../database/user';
import { getUser } from '../api/userApi';

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
    signout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

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

    const socialSignin = (provider: string) => {
        AmplifyAuth.federatedSignIn({
            provider: provider as CognitoHostedUIIdentityProvider,
        })
            .then((value) => {
                console.log('Federated sign in value: ', value);
            })
            .catch((err) => {
                console.error('Federated sign in error: ', err);
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
        signout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function RequireAuth() {
    let auth = useAuth();
    let location = useLocation();

    console.log('Require auth user: ', auth.user);

    if (auth.status === AuthStatus.Loading) {
        return (
            <Stack sx={{ pt: 6, pb: 4 }} justifyContent='center' alignItems='center'>
                <CircularProgress />
            </Stack>
        );
    }

    if (auth.status === AuthStatus.Unauthenticated || !auth.user) {
        // Redirect them to the /signin page, but save the current location they were
        // trying to go to when they were redirected. This allows us to send them
        // along to that page after they sign in, which is a nicer user experience
        // than dropping them off on the home page.
        return <Navigate to='/signin' state={{ from: location }} replace />;
    }

    return <Outlet />;
}
