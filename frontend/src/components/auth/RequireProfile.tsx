'use client';

import { useApi } from '@/api/Api';
import { useRequest } from '@/api/Request';
import { AuthStatus, useAuth } from '@/auth/Auth';
import { hasCreatedProfile, SubscriptionStatus } from '@/database/user';
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
            console.log('Checking user access');
            api.checkUserAccess()
                .then(() => {
                    request.onSuccess();
                    updateUser({
                        subscriptionStatus: SubscriptionStatus.Subscribed,
                    });
                })
                .catch((err: AxiosError) => {
                    console.log('Check user access error: ', err);
                    request.onFailure(err);
                    if (err.response?.status === 403) {
                        updateUser({
                            subscriptionStatus: SubscriptionStatus.FreeTier,
                        });
                    }
                });
        }
    }, [request, api, status, updateUser]);

    useEffect(() => {
        if (user && !hasCreatedProfile(user) && !validPathnames.includes(pathname)) {
            router.push(`/profile?redirectUri=${pathname}`);
        }
    }, [user, pathname, router]);

    return null;
}
