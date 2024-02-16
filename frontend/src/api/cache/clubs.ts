import { useEffect, useMemo } from 'react';
import { useAuth } from '../../auth/Auth';
import { Club } from '../../database/club';
import { useApi } from '../Api';
import { useRequest } from '../Request';
import { useCache } from './Cache';

/**
 * Hook to fetch and cache the current user's joined clubs. If the joined club's
 * already exist in the cache, they are returned from the cache. Otherwise, a request
 * is sent to fetch them.
 * @returns A list of the clubs the user is a member of.
 */
export function useJoinedClubs() {
    const user = useAuth().user;
    const api = useApi();
    const cache = useCache();
    const request = cache.clubs.request;

    const clubIds = user?.clubs || [];

    const clubs = useMemo(
        () => clubIds.map((id) => cache.clubs.get(id)).filter((c) => c !== undefined),
        [cache.clubs],
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
    }, [clubIds, clubs, request]);

    return {
        clubs,
        request,
    };
}

export function useClubs(clubIds: string[]) {
    const api = useApi();
    const cache = useCache();
    const request = useRequest();

    const clubs: Club[] = useMemo(
        () => clubIds.map((id) => cache.clubs.get(id)).filter((c) => c !== undefined),
        [clubIds, cache.clubs],
    ) as Club[];

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
    }, [clubIds, clubs, request]);

    return {
        clubs,
        request,
    };
}
