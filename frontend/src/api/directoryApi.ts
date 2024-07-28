import { getConfig } from '@/config';
import {
    CreateDirectoryRequest,
    Directory,
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
}

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
