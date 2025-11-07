import { getConfig } from '@/config';
import {
    GetPuzzleHistoryRequest,
    GetPuzzleHistoryResponse,
    NextPuzzleRequest,
    NextPuzzleResponse,
} from '@jackstenglein/chess-dojo-common/src/puzzles/api';
import axios, { AxiosResponse } from 'axios';

const BASE_URL = getConfig().api.baseUrl;

export interface PuzzleApiContextType {
    nextPuzzle: (request: NextPuzzleRequest) => Promise<AxiosResponse<NextPuzzleResponse>>;

    /** Returns the puzzle history for a given user. */
    getPuzzleHistory: (
        request: GetPuzzleHistoryRequest,
    ) => Promise<AxiosResponse<GetPuzzleHistoryResponse>>;
}

export function nextPuzzle(idToken: string, request: NextPuzzleRequest) {
    return axios.post<NextPuzzleResponse>(`${BASE_URL}/puzzle/next`, request, {
        headers: { Authorization: `Bearer ${idToken}` },
    });
}

export function getPuzzleHistory(idToken: string, request: GetPuzzleHistoryRequest) {
    return axios.get<GetPuzzleHistoryResponse>(`${BASE_URL}/puzzle/history`, {
        params: request,
        headers: { Authorization: `Bearer ${idToken}` },
    });
}
