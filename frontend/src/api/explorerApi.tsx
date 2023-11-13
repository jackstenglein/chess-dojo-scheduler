import axios, { AxiosResponse } from 'axios';

import { getConfig } from '../config';
import { ExplorerPosition, LichessExplorerPosition } from '../database/explorer';

const BASE_URL = getConfig().api.baseUrl;

/**
 * Provides an API for interacting with the position explorer.
 */
export type ExplorerApiContextType = {
    /**
     * Gets the ExplorerPosition with the provided FEN.
     * @param fen The FEN to fetch.
     * @returns The ExplorerPosition, if it exists.
     */
    getPosition: (fen: string) => Promise<AxiosResponse<GetExplorerPositionResult, any>>;
};

/** The result from a GetExplorerPosition request. */
export interface GetExplorerPositionResult {
    /** The data from the Dojo database. */
    dojo: ExplorerPosition | null;

    /** The data from the Lichess database. */
    lichess: LichessExplorerPosition | null;
}

/**
 * Gets the ExplorerPosition with the provided FEN.
 * @param idToken The id token of the current signed-in user.
 * @param fen The FEN to fetch.
 * @returns An AxiosResponse containing the requested ExplorerPosition.
 */
export function getPosition(idToken: string, fen: string) {
    return axios.get<GetExplorerPositionResult>(`${BASE_URL}/explorer/position`, {
        params: { fen },
        headers: { Authorization: 'Bearer ' + idToken },
    });
}
