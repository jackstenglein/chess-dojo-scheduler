import { getConfig } from '@/config';
import { BreadcrumbItem } from '@/profile/directories/DirectoryCache';
import {
    AddDirectoryItemsRequest,
    CreateDirectoryRequest,
    Directory,
    MoveDirectoryItemsRequest,
    RemoveDirectoryItemsRequest,
    ShareDirectoryRequest,
    UpdateDirectoryRequest,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import axios, { AxiosResponse } from 'axios';

const BASE_URL = getConfig().api.baseUrl;

export interface DirectoryApiContextType {
    getDirectory: (owner: string, id: string) => Promise<AxiosResponse<Directory>>;

    listBreadcrumbs: (
        owner: string,
        id: string,
    ) => Promise<AxiosResponse<Record<string, BreadcrumbItem>>>;

    createDirectory: (
        request: CreateDirectoryRequest,
    ) => Promise<AxiosResponse<CreateDirectoryResponse>>;

    updateDirectory: (
        request: UpdateDirectoryRequest,
    ) => Promise<AxiosResponse<UpdateDirectoryResponse>>;

    /**
     * Shares the directory with the users in the given request.
     * @param request The request to share the directory.
     * @returns An AxiosResponse containing the updated directory.
     */
    shareDirectory: (request: ShareDirectoryRequest) => Promise<AxiosResponse<Directory>>;

    deleteDirectories: (ids: string[]) => Promise<AxiosResponse<{ parent?: Directory }>>;

    addDirectoryItems: (
        request: AddDirectoryItemsRequest,
    ) => Promise<AxiosResponse<AddDirectoryItemsResponse>>;

    removeDirectoryItem: (
        request: RemoveDirectoryItemsRequest,
    ) => Promise<AxiosResponse<AddDirectoryItemsResponse>>;

    moveDirectoryItems: (
        request: MoveDirectoryItemsRequest,
    ) => Promise<AxiosResponse<MoveDirectoryItemsResponse>>;
}

/**
 * Sends an API request to get a directory.
 * @param idToken The id token of the current signed-in user.
 * @param owner The owner of the directory to get.
 * @param id The id of the directory to get.
 * @returns The requested directory.
 */
export function getDirectory(idToken: string, owner: string, id: string) {
    return axios.get<Directory>(`${BASE_URL}/directory/${owner}/${id}`, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        },
    });
}

export function listBreadcrumbs(idToken: string, owner: string, id: string) {
    return axios.get<Record<string, BreadcrumbItem>>(
        `${BASE_URL}/directory/${owner}/${id}/breadcrumbs`,
        {
            headers: {
                Authorization: `Bearer ${idToken}`,
            },
        },
    );
}

export interface CreateDirectoryResponse {
    directory: Directory;
    parent: Directory;
}

export function createDirectory(idToken: string, request: CreateDirectoryRequest) {
    return axios.post<CreateDirectoryResponse>(`${BASE_URL}/directory`, request, {
        headers: { Authorization: `Bearer ${idToken}` },
    });
}

export interface UpdateDirectoryResponse {
    directory: Directory;
    parent?: Directory;
}

export function updateDirectory(idToken: string, request: UpdateDirectoryRequest) {
    return axios.put<UpdateDirectoryResponse>(`${BASE_URL}/directory`, request, {
        headers: { Authorization: `Bearer ${idToken}` },
    });
}

/**
 * Sends an API request to share a directory.
 * @param idToken The id token of the current signed-in user.
 * @param request The request to share the directory.
 * @returns The updated directory.
 */
export function shareDirectory(idToken: string, request: ShareDirectoryRequest) {
    return axios.put<Directory>(
        `${BASE_URL}/directory/${request.owner}/${request.id}/share`,
        { access: request.access },
        {
            headers: { Authorization: `Bearer ${idToken}` },
        },
    );
}

/**
 * Sends an API request to delete directories.
 * @param idToken The id token of the current signed-in user.
 * @param ids The ids of the directories to delete.
 * @returns The updated parent directory.
 */
export function deleteDirectories(idToken: string, ids: string[]) {
    return axios.put<{ parent?: Directory }>(
        `${BASE_URL}/directory/delete`,
        { ids },
        {
            headers: {
                Authorization: `Bearer ${idToken}`,
            },
        },
    );
}

/** The response from the AddDirectoryItems API. */
export interface AddDirectoryItemsResponse {
    /** The updated directory. */
    directory: Directory;
}

/**
 * Sends an AddDirectoryItems request to the API.
 * @param idToken The id token of the current signed-in user.
 * @param request The request to send.
 * @returns The updated directory.
 */
export function addDirectoryItems(idToken: string, request: AddDirectoryItemsRequest) {
    return axios.put<AddDirectoryItemsResponse>(
        `${BASE_URL}/directory/${request.id}/items`,
        { games: request.games },
        {
            headers: { Authorization: `Bearer ${idToken}` },
        },
    );
}

/**
 * Sends a RemoveDirectoryItem request to the API.
 * @param idToken The id token of the current signed-in user.
 * @param request The request to send.
 * @returns The updated directory.
 */
export function removeDirectoryItem(
    idToken: string,
    request: RemoveDirectoryItemsRequest,
) {
    return axios.put<AddDirectoryItemsResponse>(
        `${BASE_URL}/directory/${request.directoryId}/items/delete`,
        { itemIds: request.itemIds },
        {
            headers: { Authorization: `Bearer ${idToken}` },
        },
    );
}

/** The response from the MoveDirectoryItems API. */
export interface MoveDirectoryItemsResponse {
    /** The updated source directory. */
    source: Directory;

    /** The updated target directory. */
    target: Directory;
}

/**
 * Sends a MoveDirectoryItems request to the API.
 * @param idToken The id token of the current signed-in user.
 * @param request The request to send.
 * @returns The updated source/target directories.
 */
export function moveDirectoryItems(idToken: string, request: MoveDirectoryItemsRequest) {
    return axios.put<MoveDirectoryItemsResponse>(
        `${BASE_URL}/directory/items/move`,
        request,
        { headers: { Authorization: `Bearer ${idToken}` } },
    );
}
