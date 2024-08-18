import { useCallback } from 'react';
import {
    URLSearchParamsInit,
    useSearchParams as useRouterSearchParams,
} from 'react-router-dom';

/**
 * Extends the default react-router useSearchParams hook by adding the
 * updateSearchParams function, which sets multiple params without
 * clearing the other params.
 * @param defaultInit The default search parameters to use.
 * @returns The updated useSearchParams hook.
 */
export function useSearchParams(defaultInit?: URLSearchParamsInit) {
    const [searchParams, setSearchParams] = useRouterSearchParams(defaultInit);

    const updateSearchParams = useCallback(
        (params: Record<string, string | string[]>) => {
            setSearchParams((searchParams) => {
                const updatedParams = new URLSearchParams(searchParams.toString());
                for (const [key, value] of Object.entries(params)) {
                    if (typeof value === 'string') {
                        updatedParams.set(key, value);
                    } else {
                        updatedParams.set(key, value.join(','));
                    }
                }
                return updatedParams;
            });
        },
        [setSearchParams],
    );

    return {
        searchParams,
        setSearchParams,
        updateSearchParams,
    };
}
