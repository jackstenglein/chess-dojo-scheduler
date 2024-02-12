import { useCallback, useEffect, useState } from 'react';
import { AxiosResponse } from 'axios';

import { ListGamesResponse } from '../../api/gameApi';
import { RequestStatus, useRequest } from '../../api/Request';
import { GameInfo } from '../../database/game';
import { useSearchParams } from 'react-router-dom';

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

    const [searchParams, setSearchParams] = useSearchParams({
        page: `${initialPage}`,
        pageSize: `${initialPageSize}`,
    });

    const [games, setGames] = useState<GameInfo[]>([]);
    const [startKey, setStartKey] = useState<string | undefined>('');
    const [searchFunc, setSearchFunc] = useState<SearchFunc | null>(
        () => initialSearchFunc
    );

    const page = parseInt(searchParams.get('page') || `${initialPage}`);
    const pageSize = parseInt(searchParams.get('pageSize') || `${initialPageSize}`);

    const onChangePage = useCallback(
        (newPage: number) => {
            reset();
            setSearchParams((prev) => {
                prev.set('page', `${newPage}`);
                return prev;
            });
        },
        [reset, setSearchParams]
    );

    const onChangePageSize = useCallback(
        (newPageSize: number) => {
            setSearchParams((prev) => {
                const oldPageSize = parseInt(
                    prev.get('pageSize') || `${initialPageSize}`
                );
                const oldPage = parseInt(prev.get('page') || `${initialPage}`);
                const newPage = Math.floor((oldPage * oldPageSize) / newPageSize);

                prev.set('page', `${newPage}`);
                prev.set('pageSize', `${newPageSize}`);
                return prev;
            });
        },
        [setSearchParams, initialPage, initialPageSize]
    );

    const onSearch = useCallback(
        (searchFunc: SearchFunc) => {
            reset();
            setGames([]);
            setStartKey('');
            setSearchFunc(() => searchFunc);
        },
        [reset, setGames, setStartKey, setSearchFunc]
    );

    useEffect(() => {
        // The search function is not set yet
        if (searchFunc === null) {
            return;
        }

        // We have already fetched this page of data and don't need to refetch
        if (games.length > (page + 1) * pageSize) {
            console.log('games.length > page * pageSize: ', games.length, page, pageSize);
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
                console.log('ListGames: ', response);
                request.onSuccess();
                setGames(games.concat(response.data.games));
                setStartKey(response.data.lastEvaluatedKey);
            })
            .catch((err) => {
                console.error('ListGames: ', err);
                request.onFailure(err);
            });
    }, [page, pageSize, games, startKey, searchFunc, request]);

    let rowCount = games.length;
    // if (startKey !== undefined) {
    //     rowCount += pageSize;
    // }

    // let data: GameInfo[] = [];
    // if (games.length > page * pageSize) {
    //     data = games.slice(page * pageSize, page * pageSize + pageSize);
    // }

    return {
        page,
        pageSize,
        data: games,
        request,
        rowCount,
        hasMore: startKey !== undefined,
        setPage: onChangePage,
        setPageSize: onChangePageSize,
        onSearch,
    };
}
