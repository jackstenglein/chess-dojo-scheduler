import { useApi } from '@/api/Api';
import { IdentifiableCache, useIdentifiableCache } from '@/api/cache/Cache';
import { Request, useRequest } from '@/api/Request';
import {
    Directory,
    DirectoryAccessRole,
    DirectoryVisibility,
    HOME_DIRECTORY_ID,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { AxiosError } from 'axios';
import {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { NIL as uuidNil } from 'uuid';

export interface BreadcrumbItem {
    /** The name of the directory in the breadcrumb item. */
    name: string;

    /** The id of the directory in the breadcrumb item. */
    id: string;

    /** The id of the parent directory in the breadcrumb item. */
    parent: string;
}

export interface BreadcrumbData {
    /** Maps a directory owner/id to its breadcrumb item. */
    breadcrumbs: Record<string, BreadcrumbItem>;

    /** Sets the entire breadcrumb data for the cache. */
    setBreadcrumbs: Dispatch<SetStateAction<Record<string, BreadcrumbItem>>>;

    /** Adds a single breadcrumb item for the given directory to the cache. */
    putBreadcrumb: (directory: Partial<Directory>) => void;
}

export interface AccessData {
    /** Maps a directory owner/id to the current user's access role. */
    accessRoles: Record<string, DirectoryAccessRole | undefined>;

    /** Puts the given directory into the cache, along with the current user's access role. */
    putWithAccess: (directory: Directory, access?: DirectoryAccessRole) => void;
}

export type DirectoryCacheContextType = IdentifiableCache<Directory> &
    BreadcrumbData &
    AccessData;

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const DirectoryCacheContext = createContext<DirectoryCacheContextType>(null!);

export function useDirectoryCache() {
    return useContext(DirectoryCacheContext);
}

export function DirectoryCacheProvider({ children }: { children: ReactNode }) {
    const directories = useIdentifiableCache<Directory>(
        (item) => `${item.owner}/${item.id}`,
    );
    const [breadcrumbs, setBreadcrumbs] = useState<Record<string, BreadcrumbItem>>({});
    const [accessData, setAccessData] = useState<
        Record<string, DirectoryAccessRole | undefined>
    >({});

    const putBreadcrumb = useCallback(
        (directory: Partial<Directory>) => {
            if (directory.owner && directory.id && directory.name && directory.parent) {
                setBreadcrumbs((data) => {
                    return {
                        ...data,
                        [`${directory.owner}/${directory.id}`]: {
                            name: directory.name || '',
                            id: directory.id || '',
                            parent: directory.parent || '',
                        },
                    };
                });
            }
        },
        [setBreadcrumbs],
    );

    const put = directories.put;
    const putDirectory = useCallback(
        (directory: Directory) => {
            put(directory);
            putBreadcrumb(directory);
        },
        [put, putBreadcrumb],
    );

    const update = directories.update;
    const updateDirectory = useCallback(
        (directory: Partial<Directory>) => {
            update(directory);
            putBreadcrumb(directory);
        },
        [update, putBreadcrumb],
    );

    const putDirectoryWithAccess = useCallback(
        (directory: Directory, access?: DirectoryAccessRole) => {
            putDirectory(directory);
            setAccessData((data) => ({
                ...data,
                [`${directory.owner}/${directory.id}`]: access,
            }));
        },
        [putDirectory, setAccessData],
    );

    return (
        <DirectoryCacheContext.Provider
            value={{
                ...directories,
                put: putDirectory,
                update: updateDirectory,
                breadcrumbs,
                setBreadcrumbs,
                putBreadcrumb,
                accessRoles: accessData,
                putWithAccess: putDirectoryWithAccess,
            }}
        >
            {children}
        </DirectoryCacheContext.Provider>
    );
}

const defaultHomeDirectory: Omit<Directory, 'owner'> = {
    id: HOME_DIRECTORY_ID,
    parent: uuidNil,
    name: 'Home',
    visibility: DirectoryVisibility.PUBLIC,
    createdAt: '',
    updatedAt: '',
    items: {},
    itemIds: [],
};

export interface UseDirectoryResponse {
    directory?: Directory;
    accessRole?: DirectoryAccessRole;
    request: Request;
    putDirectory: (directory: Directory) => void;
    updateDirectory: (directory: Partial<Directory>) => void;
}

export function useDirectory(owner: string, id: string): UseDirectoryResponse {
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
                    cache.putWithAccess(resp.data.directory, resp.data.accessRole);
                    cache.request.onSuccess();
                })
                .catch((err: AxiosError) => {
                    console.error('getDirectory: ', err);
                    if (err.response?.status === 404) {
                        cache.markFetched(compoundKey);
                        cache.request.onSuccess();
                        if (id === HOME_DIRECTORY_ID) {
                            cache.put({ ...defaultHomeDirectory, owner });
                        }
                    } else {
                        cache.request.onFailure(err);
                    }
                });
        }
    }, [api, cache, compoundKey, owner, id]);

    return {
        directory,
        accessRole: cache.accessRoles[`${owner}/${id}`],
        request: cache.request,
        putDirectory: cache.put,
        updateDirectory: cache.update,
    };
}

export function useBreadcrumbs(owner: string, id: string) {
    const cache = useDirectoryCache();
    const api = useApi();
    const request = useRequest();

    let compoundKey = `${owner}/${id}`;

    const result: BreadcrumbItem[] = [];
    while (cache.breadcrumbs[compoundKey]) {
        const item = cache.breadcrumbs[compoundKey];
        result.push(item);
        compoundKey = `${owner}/${item.parent}`;
    }

    const setBreadcrumbs = cache.setBreadcrumbs;
    useEffect(() => {
        if (id === uuidNil || request.isSent()) {
            return;
        }

        request.onStart();
        api.listBreadcrumbs(owner, id)
            .then((resp) => {
                console.log('listBreadcrumbs: ', resp);
                request.onSuccess();
                setBreadcrumbs((data) => ({ ...data, ...resp.data }));
            })
            .catch((err) => {
                console.error('listBreadcrumbs: ', err);
                request.onFailure(err);
            });
    }, [id, request, api, owner, setBreadcrumbs]);

    return result.reverse();
}
