import { ApiContextType, useApi } from '@/api/Api';
import { OnlineGameTimeClass } from '@/api/external/onlineGame';
import {
    GameData,
    LichessExplorerMove,
    LichessExplorerPosition,
    normalizeFen,
} from '@/database/explorer';
import { Chess } from '@jackstenglein/chess';
import {
    PlayerExplorerRequest,
    PlayerExplorerResponse,
} from '@jackstenglein/chess-dojo-common/src/explorer/playerExplorer';
import { Dispatch, SetStateAction, useEffect } from 'react';
import { PlayerPositionCache, PlayerPositionCacheItem } from './PlayerOpeningTree';
import { GameFilters, MAX_DOWNLOAD_LIMIT, PlayerSource } from './PlayerSource';
import { fideDpTable } from './performanceRating';

const MAX_PREFETCHED_MOVES = 3;

export function usePlayerPosition({
    sources,
    fen,
    filters,
    cache,
    setCache,
}: {
    sources: PlayerSource[];
    fen: string;
    filters: GameFilters;
    cache: PlayerPositionCache;
    setCache: Dispatch<SetStateAction<PlayerPositionCache>>;
}): PlayerPositionCacheItem | undefined {
    const api = useApi();
    const normalizedFen = normalizeFen(fen);

    const request = getRequest({ sources, fen: normalizedFen, filters });
    const params = new URLSearchParams({
        ...request,
        player: `${request.player}`,
        result: request.result?.join(',') ?? '',
        mode: request.mode ?? '',
        timeClass: request.timeClass?.join(',') ?? '',
        opponentRating: request.opponentRating?.join(',') ?? '',
        plyCount: request.plyCount?.join(',') ?? '',
        limit: `${request.limit}`,
    });
    params.sort();
    const cacheKey = params.toString();

    useEffect(() => {
        if (cache[cacheKey]) {
            void prefetchTopMoves({
                position: cache[cacheKey].position,
                api,
                cache,
                setCache,
                request,
            });
        } else {
            void fetchPosition({ api, cache, setCache, request });
        }
    }, [api, cache, cacheKey, request, setCache]);

    return cache[cacheKey];
}

function getRequest({
    sources,
    fen,
    filters,
}: {
    sources: PlayerSource[];
    fen: string;
    filters: GameFilters;
}): PlayerExplorerRequest {
    const request: PlayerExplorerRequest = {
        player: 1,
        fen,
        color: filters.color,
        result: [],
        mode: filters.rated === filters.casual ? undefined : filters.rated ? 'rated' : 'casual',
        timeClass: [],
        opponentRating: filters.opponentRating,
        plyCount: filters.plyCount,
        limit: filters.downloadLimit === MAX_DOWNLOAD_LIMIT ? undefined : filters.downloadLimit,
    };

    if (filters.win) {
        request.result?.push('win');
    }
    if (filters.draw) {
        request.result?.push('draw');
    }
    if (filters.loss) {
        request.result?.push('loss');
    }

    for (const key of Object.values(OnlineGameTimeClass)) {
        if (filters[key]) {
            request.timeClass?.push(key);
        }
    }

    return request;
}

function toLichessExplorerPosition(data: PlayerExplorerResponse): LichessExplorerPosition {
    let white = 0;
    let black = 0;
    let draws = 0;
    let totalOpponentRating = 0;
    const moves: LichessExplorerMove[] = [];

    for (const move of data) {
        white += move.white;
        black += move.black;
        draws += move.draws;
        totalOpponentRating += move.totalBlackElo;

        const totalGames = move.white + move.black + move.draws;
        if (move.san && totalGames > 0) {
            const score = move.white + move.draws / 2;
            const percentage = (score / totalGames) * 100;
            const ratingDiff = fideDpTable[Math.round(percentage)];
            const averageOpponentRating = Math.round(move.totalBlackElo / totalGames);
            const performanceRating = averageOpponentRating + ratingDiff;

            moves.push({
                san: move.san,
                white: move.white,
                black: move.black,
                draws: move.draws,
                performanceData: {
                    performanceRating,
                    averageOpponentRating,
                    playerWins: move.white,
                    playerDraws: move.draws,
                    playerLosses: move.black,
                    lastPlayed: { headers: {} } as GameData,
                },
            });
        }
    }

    const position: LichessExplorerPosition = {
        white,
        black,
        draws,
        moves,
    };

    const totalGames = white + black + draws;
    if (totalGames) {
        const score = white + draws / 2;
        const percentage = (score / totalGames) * 100;
        const ratingDiff = fideDpTable[Math.round(percentage)];
        const averageOpponentRating = Math.round(totalOpponentRating / totalGames);
        const performanceRating = averageOpponentRating + ratingDiff;
        position.performanceData = {
            performanceRating,
            averageOpponentRating,
            playerWins: white,
            playerLosses: black,
            playerDraws: draws,
            lastPlayed: { headers: {} } as GameData,
        };
    }

    return position;
}

async function fetchPosition({
    api,
    cache,
    setCache,
    request,
}: {
    api: ApiContextType;
    cache: PlayerPositionCache;
    setCache: Dispatch<SetStateAction<PlayerPositionCache>>;
    request: PlayerExplorerRequest;
}) {
    const params = new URLSearchParams({
        ...request,
        player: `${request.player}`,
        result: request.result?.join(',') ?? '',
        mode: request.mode ?? '',
        timeClass: request.timeClass?.join(',') ?? '',
        opponentRating: request.opponentRating?.join(',') ?? '',
        plyCount: request.plyCount?.join(',') ?? '',
        limit: `${request.limit}`,
    });
    params.sort();
    const cacheKey = params.toString();

    if (cache[cacheKey]) {
        return;
    }

    setCache((c) => ({
        ...c,
        [cacheKey]: {
            loading: true,
        },
    }));

    try {
        const resp = await api.getPlayerPosition(request);
        const position = toLichessExplorerPosition(resp.data);
        setCache((c) => ({
            ...c,
            [cacheKey]: {
                loading: false,
                position,
            },
        }));
    } catch (err) {
        console.error('getPlayerPosition: ', err);
        setCache((c) => ({
            ...c,
            [cacheKey]: {
                loading: false,
                error: err,
            },
        }));
    }
}

async function prefetchTopMoves({
    position,
    api,
    cache,
    setCache,
    request,
}: {
    position?: LichessExplorerPosition;
    api: ApiContextType;
    cache: PlayerPositionCache;
    setCache: Dispatch<SetStateAction<PlayerPositionCache>>;
    request: PlayerExplorerRequest;
}) {
    if (!position) {
        return;
    }
    const promises = position.moves.slice(0, MAX_PREFETCHED_MOVES).map((m) => {
        const chess = new Chess({ fen: request.fen });
        chess.move(m.san);
        return fetchPosition({
            api,
            cache,
            setCache,
            request: { ...request, fen: chess.normalizedFen() },
        });
    });
    await Promise.allSettled(promises);
}
