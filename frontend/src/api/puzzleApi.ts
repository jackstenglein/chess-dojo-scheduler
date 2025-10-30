import { getConfig } from '@/config';
import {
    NextPuzzleRequest,
    NextPuzzleResponse,
} from '@jackstenglein/chess-dojo-common/src/puzzles/api';
import axios, { AxiosResponse } from 'axios';

const BASE_URL = getConfig().api.baseUrl;

export interface PuzzleApiContextType {
    nextPuzzle: (request: NextPuzzleRequest) => Promise<AxiosResponse<NextPuzzleResponse>>;
}

export function nextPuzzle(idToken: string, request: NextPuzzleRequest) {
    return axios.post<NextPuzzleResponse>(`${BASE_URL}/puzzle/next`, request, {
        headers: { Authorization: `Bearer ${idToken}` },
    });
}
