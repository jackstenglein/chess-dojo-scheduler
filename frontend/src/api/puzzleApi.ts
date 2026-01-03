import {
    GetPuzzleHistoryRequest,
    GetPuzzleHistoryResponse,
    NextPuzzleRequest,
    NextPuzzleResponse,
} from '@jackstenglein/chess-dojo-common/src/puzzles/api';
import { AxiosResponse } from 'axios';
import { axiosService } from './axiosService';

export interface PuzzleApiContextType {
    nextPuzzle: (request: NextPuzzleRequest) => Promise<AxiosResponse<NextPuzzleResponse>>;

    /** Returns the puzzle history for a given user. */
    getPuzzleHistory: (
        request: GetPuzzleHistoryRequest,
    ) => Promise<AxiosResponse<GetPuzzleHistoryResponse>>;
}

export function nextPuzzle(idToken: string, request: NextPuzzleRequest) {
    return axiosService.post<NextPuzzleResponse>(`/puzzle/next`, request, {
        headers: { Authorization: `Bearer ${idToken}` },
        functionName: 'nextPuzzle',
    });
}

export function getPuzzleHistory(idToken: string, request: GetPuzzleHistoryRequest) {
    return axiosService.get<GetPuzzleHistoryResponse>(`/puzzle/history`, {
        params: request,
        headers: { Authorization: `Bearer ${idToken}` },
        functionName: 'getPuzzleHistory',
    });
}
