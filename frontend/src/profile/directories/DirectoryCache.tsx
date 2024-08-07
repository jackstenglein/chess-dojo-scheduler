import { useApi } from '@/api/Api';
import { IdentifiableCache, useIdentifiableCache } from '@/api/cache/Cache';
import { Directory } from '@jackstenglein/chess-dojo-common/src/database/directory';
import { AxiosError } from 'axios';
import { ReactNode, createContext, useContext, useEffect, useMemo } from 'react';

type DirectoryCacheContextType = IdentifiableCache<Directory>;

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const DirectoryCacheContext = createContext<DirectoryCacheContextType>(null!);

export function useDirectoryCache() {
    return useContext(DirectoryCacheContext);
}

export function DirectoryCacheProvider({ children }: { children: ReactNode }) {
    const directories = useIdentifiableCache<Directory>(
        (item) => `${item.owner}/${item.id}`,
    );

    return (
        <DirectoryCacheContext.Provider value={directories}>
            {children}
        </DirectoryCacheContext.Provider>
    );
}

export function useDirectory(owner: string, id: string) {
    const api = useApi();
    const cache = useDirectoryCache();

    const compoundKey = `${owner}/${id}`;
    const directory = useMemo(() => cache.get(compoundKey), [cache, compoundKey]);

    const isFetched = cache.isFetched;
    const reset = cache.request.reset;
    const success = cache.request.onSuccess;
    useEffect(() => {
        if (!isFetched(compoundKey)) {
            reset();
        } else {
            success();
        }
    }, [isFetched, reset, success, compoundKey]);

    useEffect(() => {
        if (!cache.isFetched(compoundKey) && !cache.request.isSent()) {
            cache.request.onStart();
            api.getDirectory(owner, id)
                .then((resp) => {
                    console.log('getDirectory: ', resp);
                    cache.markFetched(compoundKey);
                    cache.put(resp.data);
                    cache.request.onSuccess();
                })
                .catch((err: AxiosError) => {
                    console.error('getDirectory: ', err);
                    if (err.response?.status === 404) {
                        cache.markFetched(compoundKey);
                        cache.request.onSuccess();
                    } else {
                        cache.request.onFailure(err);
                    }
                });
        }
    }, [api, cache, compoundKey, owner, id]);

    return { directory, request: cache.request, putDirectory: cache.put };
}
