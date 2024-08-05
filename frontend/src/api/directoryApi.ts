import { getConfig } from '@/config';
import {
    AddDirectoryItemRequest,
    CreateDirectoryRequest,
    Directory,
    RemoveDirectoryItemRequest,
    UpdateDirectoryRequest,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import axios, { AxiosResponse } from 'axios';

const BASE_URL = getConfig().api.baseUrl;

export interface DirectoryApiContextType {
    getDirectory: (owner: string, id: string) => Promise<AxiosResponse<Directory>>;

    createDirectory: (
        request: CreateDirectoryRequest,
    ) => Promise<AxiosResponse<CreateDirectoryResponse>>;

    updateDirectory: (
        request: UpdateDirectoryRequest,
    ) => Promise<AxiosResponse<UpdateDirectoryResponse>>;

    deleteDirectory: (
        id: string,
    ) => Promise<AxiosResponse<Partial<UpdateDirectoryResponse>>>;

    addDirectoryItem: (
        request: AddDirectoryItemRequest,
    ) => Promise<AxiosResponse<AddDirectoryItemResponse>>;

    removeDirectoryItem: (
        request: RemoveDirectoryItemRequest,
    ) => Promise<AxiosResponse<AddDirectoryItemResponse>>;
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
    parent: Directory;
}

export function updateDirectory(idToken: string, request: UpdateDirectoryRequest) {
    return axios.put<UpdateDirectoryResponse>(`${BASE_URL}/directory`, request, {
        headers: { Authorization: `Bearer ${idToken}` },
    });
}

/**
 * Sends an API request to delete a directory.
 * @param idToken The id token of the current signed-in user.
 * @param id The id of the directory to delete.
 * @returns The directory before the delete, and the updated parent directory.
 */
export function deleteDirectory(idToken: string, id: string) {
    return axios.delete<Partial<UpdateDirectoryResponse>>(`${BASE_URL}/directory/${id}`, {
        headers: {
            Authorization: `Bearer ${idToken}`,
        },
    });
}

/** The response from the AddDirectoryItem API. */
export interface AddDirectoryItemResponse {
    /** The updated directory. */
    directory: Directory;
}

/**
 * Sends an AddDirectoryItem request to the API.
 * @param idToken The id token of the current signed-in user.
 * @param request The request to send.
 * @returns The updated directory.
 */
export function addDirectoryItem(idToken: string, request: AddDirectoryItemRequest) {
    return axios.put<AddDirectoryItemResponse>(
        `${BASE_URL}/directory/${request.id}/item`,
        { game: request.game },
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
    request: RemoveDirectoryItemRequest,
) {
    return axios.delete<AddDirectoryItemResponse>(
        `${BASE_URL}/directory/${request.directoryId}/item/${encodeURIComponent(request.itemId)}`,
        { headers: { Authorization: `Bearer ${idToken}` } },
    );
}
