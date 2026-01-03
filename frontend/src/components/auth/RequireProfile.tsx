'use client';

import { useApi } from '@/api/Api';
import { useRequest } from '@/api/Request';
import { updateUser as apiUpdateUser } from '@/api/userApi';
import { AuthStatus, useAuth } from '@/auth/Auth';
import { hasCreatedProfile, SubscriptionStatus } from '@/database/user';
import { SubscriptionTier } from '@jackstenglein/chess-dojo-common/src/database/user';
import { AxiosError } from 'axios';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const validPathnames = ['/help', '/profile'];

/**
 * If the user is signed in and has not completed their profile, this
 * component redirects them to the profile creator page. If the user is not
 * signed in, then no redirection happens. This component is also responsible
 * for verifying the user's Wix access.
 */
export function RequireProfile() {
    const { status, user, updateUser } = useAuth();
    const api = useApi();
    const request = useRequest();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (status === AuthStatus.Authenticated && !request.isSent()) {
            request.onStart();
            api.checkUserAccess()
                .then(() => {
                    request.onSuccess();
                    updateUser({
                        subscriptionStatus: SubscriptionStatus.Subscribed,
                        paymentInfo: {
                            customerId: 'WIX',
                            subscriptionId: 'WIX',
                            subscriptionTier: SubscriptionTier.Basic,
                            ...user?.paymentInfo,
                            subscriptionStatus: SubscriptionStatus.Subscribed,
                        },
                    });
                })
                .catch((err: AxiosError) => {
                    request.onFailure(err);
                    if (err.response?.status === 403) {
                        updateUser({
                            subscriptionStatus: SubscriptionStatus.NotSubscribed,
                            paymentInfo: {
                                customerId: 'WIX',
                                subscriptionId: 'WIX',
                                subscriptionTier: SubscriptionTier.Free,
                                ...user?.paymentInfo,
                                subscriptionStatus: SubscriptionStatus.NotSubscribed,
                            },
                        });
                    }
                });
        }
    }, [request, api, status, updateUser, user]);

    useEffect(() => {
        if (user && !hasCreatedProfile(user) && !validPathnames.includes(pathname)) {
            const isSocialFromMobile = localStorage.getItem('isSocialFromMobile');
            const isTraditionalLogin = localStorage.getItem('isFromMobile');
            router.push(
                `/profile?redirectUri=${pathname}${isSocialFromMobile ? '&loggedInFromMobile=true' : ''}${isTraditionalLogin ? '&loggedInFromMobile=true' : ''}`,
            );
            localStorage.removeItem('isSocialFromMobile');
        }
    }, [user, pathname, router]);

    useEffect(() => {
        let isMounted = true;

        async function updateUserWithFirebaseTokens() {
            const stored = localStorage.getItem('firebaseTokens');
            if (!stored) return;

            let firebaseTokens: string[] = [];
            try {
                const parsed: unknown = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.every((t): t is string => typeof t === 'string')) {
                    firebaseTokens = parsed;
                } else if (typeof parsed === 'string') {
                    firebaseTokens = [parsed];
                } else {
                    firebaseTokens = [stored];
                }
            } catch {
                firebaseTokens = [stored];
            }

            const idToken = user?.cognitoUser?.tokens?.idToken?.toString() ?? '';
            if (!idToken) return;

            const res = await apiUpdateUser(idToken, { firebaseTokens }, updateUser);
            if (isMounted && res?.status === 200) {
                localStorage.removeItem('firebaseTokens');
            }
        }

        void updateUserWithFirebaseTokens();

        return () => {
            isMounted = false;
        };
    }, [api, request, apiUpdateUser]);

    return null;
}
