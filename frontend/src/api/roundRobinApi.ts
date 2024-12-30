import { getConfig } from '@/config';
import {
    RoundRobin,
    RoundRobinListRequest,
    RoundRobinRegisterRequest,
    RoundRobinWaitlist,
    RoundRobinWithdrawRequest,
} from '@jackstenglein/chess-dojo-common/src/roundRobin/api';
import axios, { AxiosResponse } from 'axios';

const BASE_URL = getConfig().api.baseUrl;

export interface RoundRobinApiContextType {
    /**
     * Sends a request to register for a round robin tournament.
     * @param request The request to register for the tournament.
     * @returns The updated tournament and waitlist.
     */
    registerForRoundRobin: (
        request: RoundRobinRegisterRequest,
    ) => Promise<AxiosResponse<RoundRobinRegisterResponse>>;

    /**
     * Sends a request to withdraw from a round robin tournament.
     * @param request The request to withdraw from the tournament.
     * @returns The updated tournament.
     */
    withdrawFromRoundRobin: (
        request: RoundRobinWithdrawRequest,
    ) => Promise<AxiosResponse<RoundRobin>>;
}

export interface RoundRobinRegisterResponse {
    waitlist: RoundRobinWaitlist;
    tournament?: RoundRobin;
}

/**
 * Sends a request to register for a round robin tournament.
 * @param idToken The id token of the current signed-in user.
 * @param request The request to register for the tournament.
 * @returns The updated tournament and waitlist.
 */
export function registerForRoundRobin(
    idToken: string,
    request: RoundRobinRegisterRequest,
) {
    return axios.post<RoundRobinRegisterResponse>(
        `${BASE_URL}/tournaments/round-robin/register`,
        request,
        {
            headers: { Authorization: `Bearer ${idToken}` },
        },
    );
}

/**
 * Sends a request to withdraw from a round robin tournament.
 * @param idToken The id token of the current signed-in user
 * @param request The request to withdraw from the tournament.
 * @returns The updated tournament.
 */
export function withdrawFromRoundRobin(
    idToken: string,
    request: RoundRobinWithdrawRequest,
) {
    return axios.post<RoundRobin>(
        `${BASE_URL}/tournaments/round-robin/withdraw`,
        request,
        { headers: { Authorization: `Bearer ${idToken}` } },
    );
}

export interface RoundRobinListResponse {
    tournaments: RoundRobin[];
    lastEvaluatedKey?: string;
}

/**
 * Sends a request to list round robin tournaments.
 * @param request The request to list the tournaments.
 * @returns The list of tournaments and the last evaluated key for pagination.
 */
export function listRoundRobins(request: RoundRobinListRequest) {
    return axios.get<RoundRobinListResponse>(
        `${BASE_URL}/public/tournaments/round-robin`,
        { params: request },
    );
}
