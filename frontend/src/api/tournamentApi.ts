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
};

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
