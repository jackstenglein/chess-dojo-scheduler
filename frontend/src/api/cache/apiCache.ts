import { useEffect, useMemo } from 'react';
import { useApi } from '../Api';
import { Request, useRequest } from '../Request';
import { useCache } from './Cache';

interface UseUsersResponse {
    users: unknown[];
    request: Request<never>;
}

export function useUsers(): UseUsersResponse {
    const cache = useCache();
    const request = useRequest<never>();

    const users = useMemo(() => {
        return cache.users.list() as unknown[];
    }, [cache.users]);

    useEffect(() => {
        if (!cache.users.isFetched('all') && !request.isSent()) {
            request.onStart();
            cache.users.markFetched('all');
            // Skip actual API call for now - just mark as fetched
            request.onSuccess();
        }
    }, [cache.users, request, users.length]);

    return { users, request };
}

interface UseGamesResponse {
    games: unknown[];
    request: Request<never>;
}

export function useGames(cohort?: string): UseGamesResponse {
    const cache = useCache();
    const request = useRequest<never>();

    const games = useMemo(() => {
        if (cohort) {
            return cache.games.filter((game: unknown) => {
                const gameObj = game as { cohort?: string };
                return gameObj.cohort === cohort;
            }) as unknown[];
        }
        return cache.games.list() as unknown[];
    }, [cache.games, cohort]);

    useEffect(() => {
        const cacheKey = cohort || 'all';
        if (!cache.games.isFetched(cacheKey) && !request.isSent()) {
            request.onStart();
            cache.games.markFetched(cacheKey);
            // Skip actual API call for now - just mark as fetched
            request.onSuccess();
        }
    }, [cache.games, request, cohort, games.length]);

    return { games, request };
}

interface UseCoursesResponse {
    courses: unknown[];
    request: Request<never>;
}

export function useCourses(): UseCoursesResponse {
    const cache = useCache();
    const request = useRequest<never>();

    const courses = useMemo(() => {
        return cache.courses.list() as unknown[];
    }, [cache.courses]);

    useEffect(() => {
        if (!cache.courses.isFetched('all') && !request.isSent()) {
            request.onStart();
            cache.courses.markFetched('all');
            // Skip actual API call for now - just mark as fetched
            request.onSuccess();
        }
    }, [cache.courses, request, courses.length]);

    return { courses, request };
}

interface UseTournamentsResponse {
    tournaments: unknown[];
    request: Request<never>;
}

export function useTournaments(): UseTournamentsResponse {
    const cache = useCache();
    const request = useRequest<never>();

    const tournaments = useMemo(() => {
        return cache.tournaments.list() as unknown[];
    }, [cache.tournaments]);

    useEffect(() => {
        if (!cache.tournaments.isFetched('all') && !request.isSent()) {
            request.onStart();
            cache.tournaments.markFetched('all');
            // Skip actual API call for now - just mark as fetched
            request.onSuccess();
        }
    }, [cache.tournaments, request, tournaments.length]);

    return { tournaments, request };
}

interface UseScoreboardResponse {
    scoreboard: unknown[];
    request: Request<never>;
}

export function useScoreboard(cohort?: string): UseScoreboardResponse {
    const api = useApi();
    const cache = useCache();
    const request = useRequest<never>();

    const scoreboard = useMemo(() => {
        if (cohort) {
            return cache.scoreboard.filter((item: unknown) => {
                const itemObj = item as { cohort?: string };
                return itemObj.cohort === cohort;
            }) as unknown[];
        }
        return cache.scoreboard.list() as unknown[];
    }, [cache.scoreboard, cohort]);

    useEffect(() => {
        const cacheKey = cohort || 'all';
        if (!cache.scoreboard.isFetched(cacheKey) && !request.isSent()) {
            request.onStart();
            cache.scoreboard.markFetched(cacheKey);
            api.getScoreboard(cohort || '')
                .then((scoreboard) => {
                    // Handle the response properly
                    const users = Array.isArray(scoreboard) ? scoreboard : [];
                    cache.scoreboard.putMany(users);
                    request.onSuccess();
                })
                .catch((err) => {
                    console.error('Scoreboard API error:', err);
                    // In offline mode, don't mark as failure if we have cached data
                    if (typeof window !== 'undefined' && !navigator.onLine && scoreboard.length > 0) {
                        console.log('[Cache] Using cached scoreboard in offline mode');
                        request.onSuccess();
                    } else {
                        request.onFailure(err);
                    }
                });
        }
    }, [api, cache.scoreboard, request, cohort, scoreboard.length]);

    return { scoreboard, request };
}
