import { useApi } from '@/api/Api';
import { ListGamesResponse } from '@/api/gameApi';
import { useRequest } from '@/api/Request';
import { dojoCohorts } from '@/database/user';
import { PaginationResult } from '@/hooks/usePagination';
import { FEN } from '@jackstenglein/chess';
import { useEffect, useRef, useState } from 'react';
import { ExplorerDatabaseType } from './Explorer';

export function usePositionGames({
    fen,
    type,
    minCohort,
    maxCohort,
    timeControls,
}: {
    fen: string;
    type: ExplorerDatabaseType;
    minCohort: string;
    maxCohort: string;
    timeControls: string[];
}): PaginationResult {
    const api = useApi();
    const request = useRequest();
    const reset = request.reset;
    const cache = useRef(
        new Map<string, Partial<Record<ExplorerDatabaseType, ListGamesResponse>>>(),
    );

    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        if (fen !== FEN.start) {
            reset();
        }
    }, [fen, reset]);

    useEffect(() => {
        if (type === ExplorerDatabaseType.Dojo || type === ExplorerDatabaseType.Masters) {
            reset();
        }
    }, [type, reset]);

    const current = cache.current.get(fen)?.[type];

    const games = (current?.games ?? []).filter((g) => {
        if (type === ExplorerDatabaseType.Dojo) {
            if (
                minCohort &&
                dojoCohorts.indexOf(minCohort) > dojoCohorts.indexOf(g.cohort)
            ) {
                return false;
            }
            if (
                maxCohort &&
                dojoCohorts.indexOf(maxCohort) < dojoCohorts.indexOf(g.cohort)
            ) {
                return false;
            }
        } else if (
            type === ExplorerDatabaseType.Masters &&
            timeControls.length > 0 &&
            !timeControls.includes(g.timeClass?.toLowerCase() || '')
        ) {
            return false;
        }
        return true;
    });

    const onChangePageModel = (newPage: number, newPageSize: number) => {
        if (type !== ExplorerDatabaseType.Dojo && type !== ExplorerDatabaseType.Masters) {
            return;
        }

        setPage(newPage);
        setPageSize(newPageSize);
        if (games.length > (newPage + 2) * newPageSize) {
            return; // Already have enough data to support this page, plus one extra.
        }
        reset();
    };

    useEffect(() => {
        if (type !== ExplorerDatabaseType.Dojo && type !== ExplorerDatabaseType.Masters) {
            return;
        }
        if (fen === FEN.start) {
            return;
        }

        const currentType = cache.current.get(fen)?.[type];
        if (games.length > (page + 2) * pageSize) {
            return; // Already have enough data to support this page, plus one extra.
        }
        if (currentType && !currentType.lastEvaluatedKey) {
            return; // There are no more pages to fetch
        }
        if (request.isSent()) {
            return;
        }

        request.onStart();
        api.listGamesByPosition(
            fen,
            type === ExplorerDatabaseType.Masters,
            currentType?.lastEvaluatedKey,
        )
            .then((resp) => {
                const current = cache.current.get(fen);
                cache.current.set(fen, {
                    ...current,
                    [type]: {
                        games: (current?.[type]?.games ?? []).concat(resp.data.games),
                        lastEvaluatedKey: resp.data.lastEvaluatedKey,
                    },
                });
                request.onSuccess();
            })
            .catch((err) => {
                console.error('usePositionGames: ', err);
                request.onFailure(err);
            });
    }, [page, pageSize, cache, request, api, fen, type, games]);

    return {
        page,
        setPage: (newPage: number) => onChangePageModel(newPage, pageSize),
        pageSize,
        setPageSize: (newPageSize: number) => onChangePageModel(page, newPageSize),
        data: games,
        request,
        hasMore: current?.lastEvaluatedKey !== undefined,
        rowCount: games.length,
        setGames: () => null,
        onSearch: () => null,
        onDelete: () => null,
    };
}
