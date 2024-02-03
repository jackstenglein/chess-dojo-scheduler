import axios, { AxiosResponse } from 'axios';

import { getConfig } from '../config';
import { Leaderboard, OpenClassical, TournamentType } from '../database/tournament';

const BASE_URL = getConfig().api.baseUrl;

export type TimePeriod = 'monthly' | 'yearly';
export type TimeControl = 'blitz' | 'rapid' | 'classical';

export type TournamentApiContextType = {
    /**
     * getLeaderboard returns the requested leaderboard.
     * @param timePeriod The time period the leaderboard covers. Either monthly or yearly.
     * @param tournamentType The type of the leaderboard. Valid values are arena, swiss and grand_prix.
     * @param timeControl The time control of the leaderboard. Valid values are blitz, rapid and classical.
     * @param date The ISO-3601 date of the leaderboard to fetch.
     * @returns An AxiosResponse containing the requested leaderboard.
     */
    getLeaderboard: (
        timePeriod: TimePeriod,
        tournamentType: TournamentType,
        timeControl: TimeControl,
        date: string
    ) => Promise<AxiosResponse<Leaderboard>>;

    /**
     * Fetches the requested Open Classical.
     * @param startsAt The time period the open classical starts at. If not provided, the
     * current tournament will be returned.
     * @returns An AxiosResponse containing the requested OpenClassical.
     */
    getOpenClassical: (startsAt?: string) => Promise<AxiosResponse<OpenClassical, any>>;

    /**
     * Submits a request to register for the Open Classical.
     * @param req The Open Classical registration request.
     * @returns An empty AxiosResponse.
     */
    registerForOpenClassical: (
        req: OpenClassicalRegistrationRequest
    ) => Promise<AxiosResponse<void, any>>;

    /**
     * Submits a request to enter results for the Open Classical.
     * @param req The Open Classical result submission request.
     * @returns An empty AxiosResponse.
     */
    submitResultsForOpenClassical: (
        req: OpenClassicalSubmitResultsRequest
    ) => Promise<AxiosResponse<OpenClassical, any>>;

    /**
     * Sets the pairings for the given round using the given PGN data. Only admins and tournament
     * admins can call this function.
     * @param req The Open Classical put pairings request.
     * @returns An AxiosResponse containing the updated open classical.
     */
    putOpenClassicalPairings: (
        req: OpenClassicalPutPairingsRequest
    ) => Promise<AxiosResponse<OpenClassical, any>>;

    /**
     * Returns a list of previous open classicals.
     * @param startKey The optional start key to use when listing the open classicals.
     * @returns A list of previous open classicals, in descending order by date.
     */
    listPreviousOpenClassicals: (startKey?: string) => Promise<OpenClassical[]>;
};

/** A request to register for the Open Classical. */
export interface OpenClassicalRegistrationRequest {
    email: string;
    lichessUsername: string;
    discordUsername: string;
    title: string;
    region: string;
    section: string;
    byeRequests: boolean[];
}

/** A request to submit results for the Open Classical. */
export interface OpenClassicalSubmitResultsRequest {
    email: string;
    region: string;
    section: string;
    gameUrl: string;
    white: string;
    black: string;
    result: string;
    reportOpponent: boolean;
    notes: string;
}

export interface OpenClassicalPutPairingsRequest {
    /** Updates whether the tournament is accepting registrations. */
    closeRegistrations?: boolean;

    /** The region to update pairings for. */
    region?: string;

    /** The section to update pairings for. */
    section?: string;

    /** The round to update pairings for. */
    round?: number;

    /** The PGN to use when updating the pairings. */
    pgnData?: string;
}

/**
 * getLeaderboard returns the requested leaderboard.
 * @param timePeriod The time period the leaderboard covers. Either monthly or yearly.
 * @param tournamentType The type of the leaderboard. Valid values are arena, swiss and grand_prix.
 * @param timeControl The time control of the leaderboard. Valid values are blitz, rapid and classical.
 * @param date The ISO-3601 date of the leaderboard to fetch.
 * @returns An AxiosResponse containing the requested leaderboard.
 */
export function getLeaderboard(
    timePeriod: TimePeriod,
    tournamentType: TournamentType,
    timeControl: TimeControl,
    date: string
) {
    return axios.get<Leaderboard>(`${BASE_URL}/public/tournaments/leaderboard`, {
        params: {
            timePeriod,
            tournamentType,
            timeControl,
            date,
        },
    });
}

/**
 * Fetches the requested Open Classical.
 * @param startsAt The time period the open classical starts at. If not provided, the
 * current tournament will be returned.
 * @returns An AxiosResponse containing the requested OpenClassical.
 */
export function getOpenClassical(startsAt?: string) {
    return axios.get<OpenClassical>(`${BASE_URL}/public/tournaments/open-classical`, {
        params: { startsAt },
    });
}

/**
 * Submits a request to register for the Open Classical.
 * @param idToken The id token of the signed-in user.
 * @param req The Open Classical registration request.
 * @returns An empty AxiosResponse.
 */
export function registerForOpenClassical(
    idToken: string,
    req: OpenClassicalRegistrationRequest
) {
    return axios.post<void>(
        `${BASE_URL}${idToken ? '' : '/public'}/tournaments/open-classical/register`,
        req,
        {
            headers: idToken ? { Authorization: 'Bearer ' + idToken } : undefined,
        }
    );
}

/**
 * Submits a request to enter results for the Open Classical.
 * @param idToken The id token of the signed-in user.
 * @param req The Open Classical result submission request.
 * @returns An empty AxiosResponse.
 */
export function submitResultsForOpenClassical(
    idToken: string,
    req: OpenClassicalSubmitResultsRequest
) {
    return axios.post<OpenClassical>(
        `${BASE_URL}${idToken ? '' : '/public'}/tournaments/open-classical/results`,
        req,
        {
            headers: idToken ? { Authorization: 'Bearer ' + idToken } : undefined,
        }
    );
}

/**
 * Sets the pairings for the given round using the given PGN data. Only admins and tournament
 * admins can call this function.
 * @param idToken The id
 * @param round The round to set.
 * @param pgnData The PGN data containing the pairings.
 * @returns An AxiosResponse containing the updated open classical.
 */
export function putOpenClassicalPairings(
    idToken: string,
    req: OpenClassicalPutPairingsRequest
) {
    return axios.put<OpenClassical>(
        `${BASE_URL}/tournaments/open-classical/pairings`,
        req,
        { headers: { Authorization: 'Bearer ' + idToken } }
    );
}

interface ListPreviousOpenClassicalsResponse {
    openClassicals: OpenClassical[];
    lastEvaluatedKey: string;
}

/**
 * Returns a list of previous open classicals.
 * @param startKey The optional start key to use when listing the open classicals.
 * @returns A list of previous open classicals, in descending order by date.
 */
export async function listPreviousOpenClassicals(startKey?: string) {
    const result: OpenClassical[] = [];
    const params = { startKey };

    do {
        const resp = await axios.get<ListPreviousOpenClassicalsResponse>(
            `${BASE_URL}/public/tournaments/open-classical/previous`,
            {
                params,
            }
        );

        result.push(...resp.data.openClassicals);
        params.startKey = resp.data.lastEvaluatedKey;
    } while (params.startKey);

    return result;
}
