import { useRequest } from '@/api/Request';
import { PaginationResult } from '@/hooks/usePagination';
import { useState } from 'react';
import { OpeningTree } from './OpeningTree';
import { GameFilters } from './PlayerSource';

const emptyFunction = () => null;

export function usePlayerGames(
    fen: string,
    openingTree?: OpeningTree,
    filters?: GameFilters,
): PaginationResult {
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const request = useRequest();

    const onChangePageModel = (newPage: number, newPageSize: number) => {
        setPage(newPage);
        setPageSize(newPageSize);
    };

    const games =
        openingTree?.getGames(fen, filters).map((g) => ({
            cohort: '',
            id: g.url,
            date: g.headers.Date || '',
            publishedAt: g.headers.Date || '',
            owner: '',
            ownerDisplayName: '',
            ownerPreviousCohort: '',
            headers: {
                ...g.headers,
                White: g.white,
                Black: g.black,
                Date: g.headers.Date || '',
                Site: g.url,
                Result: g.result,
            },
            createdAt: '',
            unlisted: true,
        })) ?? [];

    console.log('Games: ', games);

    return {
        page,
        setPage: (newPage: number) => onChangePageModel(newPage, pageSize),
        pageSize,
        setPageSize: (newPageSize: number) => onChangePageModel(page, newPageSize),
        request,
        hasMore: false,
        data: games,
        rowCount: games.length,
        setGames: emptyFunction,
        onSearch: emptyFunction,
        onDelete: emptyFunction,
    };
}
