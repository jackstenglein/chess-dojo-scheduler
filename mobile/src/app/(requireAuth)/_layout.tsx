import { useRouter, usePathname } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { useEffect } from 'react';

import { useApi } from '@/api/Api';
import { useRequest } from '@/api/Request';
import { useAuth, AuthStatus } from '@/auth/Auth';
import { SubscriptionStatus } from '@/database/user';
import LoadingPage from '@/loading/LoadingPage';
import { DrawerToggleButton } from '@react-navigation/drawer';

/**
 * A React component that renders an Outlet only if the current user is signed in and has a completed profile.
 * If the user is not signed in, then they are redirected to the landing page. If the user is signed in, but
 * has not completed their profile, the profile editor page is rendered regardless of the current route.
 */
export default function RequireAuth() {
    const auth = useAuth();
    const user = auth.user;
    const api = useApi();
    const request = useRequest();
    const router = useRouter();
    const pathname = usePathname();
    // const search = useGlobalSearchParams();

    // const location = useLocation();

    useEffect(() => {
        if (auth.status === AuthStatus.Authenticated && !request.isSent() && api) {
            request.onStart();
            console.log('Checking user access');
            api.checkUserAccess()
                .then(() => {
                    request.onSuccess();
                    auth.updateUser({
                        subscriptionStatus: SubscriptionStatus.Subscribed,
                    });
                })
                .catch((err) => {
                    console.log('Check user access error: ', err.response);
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
        console.log('Navigating to /');
        router.replace({ pathname: '/', params: { redirectUri: `${pathname}` } });
    }

    // if (!hasCreatedProfile(user)) {
    // return <ProfileCreatorPage />;
    // }

    return (
        <Drawer
            screenOptions={{
                headerLeft: () => <DrawerToggleButton tintColor='white' />,
                headerShown: true,
            }}
        >
            <Drawer.Screen
                name='profile/index'
                options={{
                    drawerLabel: 'Training Plan',
                    title: 'Training Plan',
                }}
            />
            <Drawer.Screen
                name='settings/index'
                options={{
                    drawerLabel: 'Settings',
                    title: 'overview',
                }}
            />
        </Drawer>
    );
}
