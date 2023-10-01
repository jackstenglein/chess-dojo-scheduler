import axios, { AxiosResponse } from 'axios';

import { getConfig } from '../config';
import { Leaderboard, TournamentType } from '../database/tournament';

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
     * Submits a request to register for the Open Classical.
     * @param req The Open Classical registration request.
     * @returns An empty AxiosResponse.
     */
    registerForOpenClassical: (
        req: OpenClassicalRegistrationRequest
    ) => Promise<AxiosResponse<void, any>>;
};

/** A request to register for the Open Classical. */
export interface OpenClassicalRegistrationRequest {
    email: string;
    lichessUsername: string;
    discordUsername: string;
    title: string;
    byeRequests: boolean[];
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
