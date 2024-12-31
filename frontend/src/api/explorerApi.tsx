import { getConfig } from '@/config';
import {
    ExplorerPosition,
    ExplorerPositionFollower,
    LichessExplorerPosition,
} from '@/database/explorer';
import { LichessTablebasePosition } from '@jackstenglein/chess-dojo-common/src/explorer/types';
import axios, { AxiosResponse } from 'axios';

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

    /**
     * Creates, updates or deletes an ExplorerPositionFollower with the provided parameters.
     * @param request The FollowPositionRequest to send.
     * @returns The new ExplorerPositionFollower or null if request.unfollow is true.
     */
    followPosition: (
        request: FollowPositionRequest,
    ) => Promise<AxiosResponse<ExplorerPositionFollower | null>>;
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

/** A request to create or update an ExplorerPositionFollower. */
export interface FollowPositionRequest {
    /** The FEN of the position to update. */
    fen: string;

    /** The minimum cohort to trigger game notifications. */
    minCohort?: string;

    /** The maximum cohort to trigger game notifications. */
    maxCohort?: string;

    /** Whether to disable notifications for variations. */
    disableVariations?: boolean;

    /** Whether to delete an existing ExplorerPositionFollower. */
    unfollow?: boolean;
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
