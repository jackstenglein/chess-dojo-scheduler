import { useCallback, useEffect, useState } from 'react';
import { AxiosResponse } from 'axios';

import { ListGamesResponse } from '../api/gameApi';
import { RequestStatus, useRequest } from '../api/Request';
import { GameInfo } from '../database/game';

export type SearchFunc = (
    startKey: string
) => Promise<AxiosResponse<ListGamesResponse, any>>;

export function usePagination(
    initialSearchFunc: SearchFunc | null,
    initialPage: number,
    initialPageSize: number
) {
    const request = useRequest();
    const reset = request.reset;

    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [games, setGames] = useState<GameInfo[]>([]);
    const [startKey, setStartKey] = useState<string | undefined>('');
    const [searchFunc, setSearchFunc] = useState<SearchFunc | null>(
        () => initialSearchFunc
    );

    const onChangePage = useCallback(
        (newPage: number) => {
            reset();
            setPage(newPage);
        },
        [reset, setPage]
    );

    const onSearch = useCallback(
        (searchFunc: SearchFunc) => {
            reset();
            setPage(0);
            setGames([]);
            setStartKey('');
            setSearchFunc(() => searchFunc);
        },
        [reset, setPage, setGames, setStartKey, setSearchFunc]
    );

    useEffect(() => {
        // The search function is not set yet
        if (searchFunc === null) {
            return;
        }

        // We have already fetched this page of data and don't need to refetch
        if (games.length > page * pageSize) {
            return;
        }

        // There are no more pages to fetch
        if (startKey === undefined) {
            return;
        }

        // The request is already sent and we don't want to duplicate it
        if (request.isLoading() || request.status === RequestStatus.Failure) {
            return;
        }

        // We need to fetch the next page
        console.log('Fetching page: ', page);
        request.onStart();

        searchFunc(startKey)
            .then((response) => {
                console.log('ListGamesByCohort: ', response);
                request.onSuccess();
                setGames(games.concat(response.data.games));
                setStartKey(response.data.lastEvaluatedKey);
            })
            .catch((err) => {
                console.error('ListGamesByCohort: ', err);
                request.onFailure(err);
            });
    }, [page, pageSize, games, startKey, searchFunc, request]);

    let rowCount = games.length;
    if (startKey !== undefined) {
        rowCount += pageSize;
    }

    let data: GameInfo[] = [];
    if (games.length > page * pageSize) {
        data = games.slice(page * pageSize, page * pageSize + pageSize);
    }

    return {
        page,
        pageSize,
        data,
        request,
        rowCount,
        setPage: onChangePage,
        setPageSize,
        onSearch,
    };
}
