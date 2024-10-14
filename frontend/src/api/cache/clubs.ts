'use client';

import { useEffect, useMemo } from 'react';
import { useApi } from '../Api';
import { useRequest } from '../Request';
import { useCache } from './Cache';

/**
 * Fetches and caches a list of clubs. If the clubs provided are all already present
 * in the cache, no network request is sent. Otherwise, the clubs are re-fetched from
 * the server.
 * @param clubIds The ids of the clubs to fetch.
 * @returns A cached list of clubs.
 */
export function useClubs(clubIds: string[]) {
    const api = useApi();
    const cache = useCache();
    const request = useRequest();

    const clubs = useMemo(
        () => clubIds.map((id) => cache.clubs.get(id)).filter((c) => c !== undefined),
        [clubIds, cache.clubs],
    );

    useEffect(() => {
        if (clubIds.length !== clubs.length && !request.isSent()) {
            request.onStart();

            api.batchGetClubs(clubIds)
                .then((resp) => {
                    console.log('batchGetClubs: ', resp.data);
                    cache.clubs.putMany(resp.data);
                    request.onSuccess();
                })
                .catch((err) => {
                    console.error('batchGetClubs: ', err);
                    request.onFailure(err);
                });
        }
    }, [clubIds, clubs, request, api, cache.clubs]);

    return {
        clubs,
        request,
    };
}
