import { getConfig } from '@/config';
import { BreadcrumbItem } from '@/profile/directories/DirectoryCache';
import {
    AddDirectoryItemsRequestV2,
    CreateDirectoryRequestV2Client,
    Directory,
    DirectoryAccessRole,
    ListBreadcrumbsRequest,
    MoveDirectoryItemsRequest,
    RemoveDirectoryItemsRequestV2,
    ShareDirectoryRequest,
    UpdateDirectoryRequestV2,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import axios, { AxiosResponse } from 'axios';

const BASE_URL = getConfig().api.baseUrl;

export interface DirectoryApiContextType {
    /**
     * Sends an API request to get a directory.
     * @param owner The owner of the directory to get.
     * @param id The id of the directory to get.
     * @returns The requested directory and the caller's access role for that directory.
     */
    getDirectory: (
        owner: string,
        id: string,
    ) => Promise<AxiosResponse<GetDirectoryResponse>>;

    /**
     * Sends an API request to list the breadcrumbs for a directory.
     * @param request The request to list the breadcrumbs.
     * @returns A map from the directory id to the breadcrumb data.
     */
    listBreadcrumbs: (
        request: ListBreadcrumbsRequest,
    ) => Promise<AxiosResponse<Record<string, BreadcrumbItem>>>;

    /**
     * Sends an API request to create a directory.
     * @param request The create directory request.
     * @returns The parent directory, the child directory and the caller's access role for the child directory.
     */
    createDirectory: (
        request: CreateDirectoryRequestV2Client,
    ) => Promise<AxiosResponse<CreateDirectoryResponse>>;

    /**
     * Sends an API request to update a directory's name, visibility and/or item order.
     * The caller must have Admin or higher permissions on the directory.
     * @param request The update directory request.
     * @returns An AxiosResponse containing the updated directory and potentially the updated parent directory.
     */
    updateDirectory: (
        request: UpdateDirectoryRequestV2,
    ) => Promise<AxiosResponse<UpdateDirectoryResponse>>;

    /**
     * Shares the directory with the users in the given request.
     * @param request The request to share the directory.
     * @returns An AxiosResponse containing the updated directory.
     */
    shareDirectory: (request: ShareDirectoryRequest) => Promise<AxiosResponse<Directory>>;

    deleteDirectories: (ids: string[]) => Promise<AxiosResponse<{ parent?: Directory }>>;

    addDirectoryItems: (
        request: AddDirectoryItemsRequestV2,
    ) => Promise<AxiosResponse<AddDirectoryItemsResponse>>;

    /**
     * Sends a RemoveDirectoryItem request to the API.
     * @param request The request to send.
     * @returns The updated directory.
     */
    removeDirectoryItem: (
        request: RemoveDirectoryItemsRequestV2,
    ) => Promise<AxiosResponse<AddDirectoryItemsResponse>>;

    moveDirectoryItems: (
        request: MoveDirectoryItemsRequest,
    ) => Promise<AxiosResponse<MoveDirectoryItemsResponse>>;
}

export interface GetDirectoryResponse {
    /** The requested directory. */
    directory: Directory;

    /** The access role of the current user for the given directory. */
    accessRole?: DirectoryAccessRole;
}

/**
 * Sends an API request to get a directory.
 * @param idToken The id token of the current signed-in user.
 * @param owner The owner of the directory to get.
 * @param id The id of the directory to get.
 * @returns The requested directory and the caller's access role for that directory.
 */
export function getDirectory(idToken: string, owner: string, id: string) {
    return axios.get<GetDirectoryResponse>(`${BASE_URL}/directory/${owner}/${id}/v2`, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        },
    });
}

/**
 * Sends an API request to list the breadcrumbs for a directory.
 * @param idToken The id token of the current signed-in user.
 * @param request The request to list the breadcrumbs.
 * @returns A map from the directory id to the breadcrumb data.
 */
export function listBreadcrumbs(idToken: string, request: ListBreadcrumbsRequest) {
    const { owner, id, ...rest } = request;
    return axios.get<Record<string, BreadcrumbItem>>(
        `${BASE_URL}/directory/${owner}/${id}/breadcrumbs`,
        {
            params: rest,
            headers: {
                Authorization: `Bearer ${idToken}`,
            },
        },
    );
}

/** The response from a request to create a directory. */
export interface CreateDirectoryResponse {
    /** The newly-created child directory. */
    directory: Directory;

    /** The updated parent directory. */
    parent: Directory;

    /** The caller's access on the child directory. */
    accessRole: DirectoryAccessRole;
}

/**
 * Sends an API request to create a directory.
 * @param idToken The id token of the current signed-in user.
 * @param request The request to create the directory.
 * @returns An AxiosResponse containing the parent directory, the child directory
 * and the caller's access role on the child directory.
 */
export function createDirectory(
    idToken: string,
    request: CreateDirectoryRequestV2Client,
) {
    const { owner, parent, ...rest } = request;
    return axios.post<CreateDirectoryResponse>(
        `${BASE_URL}/directory/${owner}/${parent}`,
        rest,
        {
            headers: { Authorization: `Bearer ${idToken}` },
        },
    );
}

export interface UpdateDirectoryResponse {
    directory: Directory;
    parent?: Directory;
}

/**
 * Sends an API request to update a directory's name, visibility and/or item order.
 * The caller must have Admin or higher permissions on the directory.
 * @param request The update directory request.
 * @returns An AxiosResponse containing the updated directory and potentially the updated parent directory.
 */
export function updateDirectory(idToken: string, request: UpdateDirectoryRequestV2) {
    const { owner, id, ...rest } = request;
    return axios.put<UpdateDirectoryResponse>(
        `${BASE_URL}/directory/${owner}/${id}`,
        rest,
        {
            headers: { Authorization: `Bearer ${idToken}` },
        },
    );
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
export function addDirectoryItems(idToken: string, request: AddDirectoryItemsRequestV2) {
    return axios.put<AddDirectoryItemsResponse>(
        `${BASE_URL}/directory/${request.owner}/${request.id}/items`,
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
    request: RemoveDirectoryItemsRequestV2,
) {
    return axios.put<AddDirectoryItemsResponse>(
        `${BASE_URL}/directory/${request.owner}/${request.directoryId}/items/delete`,
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
