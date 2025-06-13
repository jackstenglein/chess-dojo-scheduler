import { FollowPositionRequest } from '@jackstenglein/chess-dojo-common/src/explorer/follower';
import {
    PlayerExplorerRequest,
    PlayerExplorerResponse,
} from '@jackstenglein/chess-dojo-common/src/explorer/playerExplorer';
import { LichessTablebasePosition } from '@jackstenglein/chess-dojo-common/src/explorer/types';
import axios, { AxiosResponse } from 'axios';
import { getConfig } from '../config';
import {
    ExplorerPosition,
    ExplorerPositionFollower,
    LichessExplorerPosition,
} from '../database/explorer';

const BASE_URL = getConfig().api.baseUrl;

/**
 * Provides an API for interacting with the position explorer.
 */
export interface ExplorerApiContextType {
    /**
     * Gets the ExplorerPosition with the provided FEN.
     * @param fen The FEN to fetch.
     * @returns The ExplorerPosition, if it exists.
     */
    getPosition: (fen: string) => Promise<AxiosResponse<GetExplorerPositionResult>>;

    getPlayerPosition: (
        request: PlayerExplorerRequest,
    ) => Promise<AxiosResponse<PlayerExplorerResponse>>;

    /**
     * Creates, updates or deletes an ExplorerPositionFollower with the provided parameters.
     * @param request The FollowPositionRequest to send.
     * @returns The new ExplorerPositionFollower or null if request.unfollow is true.
     */
    followPosition: (
        request: FollowPositionRequest,
    ) => Promise<AxiosResponse<ExplorerPositionFollower | null>>;

    /**
     * Fetches a list of positions the caller has followed.
     */
    listFollowedPositions: () => Promise<AxiosResponse<ListFollowedPositionsResponse>>;
}

/** The result from a GetExplorerPosition request. */
export interface GetExplorerPositionResult {
    /** The normalized FEN of the requested position. */
    normalizedFen: string;

    /** The data from the Dojo database. */
    dojo: ExplorerPosition | null;

    /** The data from the Dojo masters database. */
    masters: ExplorerPosition | null;

    /** The data from the Lichess database. */
    lichess: LichessExplorerPosition | null;

    /** The data from the Lichess tablebase API. */
    tablebase: LichessTablebasePosition | null;

    /** The follower config, if the caller is following the position. */
    follower: ExplorerPositionFollower | null;
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

export function getPlayerPosition(idToken: string, request: PlayerExplorerRequest) {
    return axios.put<PlayerExplorerResponse>(`${BASE_URL}/explorer/player/position`, request, {
        headers: { Authorization: `Bearer ${idToken}` },
    });
}

/**
 * Creates, updates or deletes an ExplorerPositionFollower with the provided parameters.
 * @param idToken The id token of the current signed-in user.
 * @param request The FollowPositionRequest to send.
 * @returns The new ExplorerPositionFollower or null if request.unfollow is true.
 */
export function followPosition(idToken: string, request: FollowPositionRequest) {
    return axios.put<ExplorerPositionFollower | null>(
        `${BASE_URL}/explorer/position/follower`,
        request,
        { headers: { Authorization: 'Bearer ' + idToken } },
    );
}

export interface ListFollowedPositionsResponse {
    /** The followed positions */
    positions: ExplorerPositionFollower[];
    /** The last evaluated key for pagination. */
    lastEvaluatedKey?: string;
}

/**
 * Fetches a list of positions the caller has followed.
 * @param idToken The id token of the current signed-in user.
 * @returns The list of followed positions.
 */
export function listFollowedPositions(idToken: string) {
    return axios.get<ListFollowedPositionsResponse>(`${BASE_URL}/explorer/position/follower`, {
        headers: { Authorization: `Bearer ${idToken}` },
    });
}
