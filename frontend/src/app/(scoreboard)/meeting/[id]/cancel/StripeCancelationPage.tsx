'use client';

import { useApi } from '@/api/Api';
import { useRequest } from '@/api/Request';
import { useCache } from '@/api/cache/Cache';
import { useAuth } from '@/auth/Auth';
import LoadingPage from '@/loading/LoadingPage';
import { useEffect } from 'react';

export function StripeCancelationPage({ meetingId }: { meetingId: string }) {
    const api = useApi();
    const request = useRequest();
    const cache = useCache();
    const { user } = useAuth();
    const put = cache.events.put;

    useEffect(() => {
        if (user && meetingId && !request.isSent()) {
            request.onStart();
            api.cancelEvent(meetingId)
                .then((resp) => {
                    request.onSuccess();
                    put(resp.data);
                    window.location.href = '/calendar';
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [request, api, meetingId, put, user]);

    return <LoadingPage />;
}
