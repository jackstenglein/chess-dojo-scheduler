import { getConfig } from '@/config';
import {
    GetRecordingRequest,
    LiveClass,
} from '@jackstenglein/chess-dojo-common/src/liveClasses/api';
import axios, { AxiosResponse } from 'axios';

const BASE_URL = getConfig().api.baseUrl;

export interface LiveClassesApiContextType {
    /** Returns a list of live class recordings. */
    listRecordings: () => Promise<AxiosResponse<{ classes: LiveClass[] }>>;

    /** Returns a presigned URL for the recording. */
    getRecording: (request: GetRecordingRequest) => Promise<AxiosResponse<{ url: string }>>;
}

export function listRecordings() {
    return axios.get<{ classes: LiveClass[] }>(`${BASE_URL}/public/live-classes/recordings`);
}

export function getRecording(idToken: string, request: GetRecordingRequest) {
    return axios.get<{ url: string }>(`${BASE_URL}/live-classes/recording`, {
        params: request,
        headers: {
            Authorization: `Bearer ${idToken}`,
        },
    });
}
