import { getConfig } from '@/config';
import axios from 'axios';

/**
 * The Round Robin Info API response
 */
export interface TournamentData {
    info: string; // tournament id
    tournamentname: string; // name
    pairs: string[][]; // pairings
    message: string; // success message
    desc: string; // tournament desc
    crosstable: string[][]; // raw crosstable data
    crosstableString: string; // debugging crosstable string
    leaderboard: string[]; // leaderboard
    players: string[]; // players
    gameSub: string[]; // game submissions
    statusCode: number; // status code
    scores: number[]; // leaderboard scores
}


interface RoundRobinApi{
    message: string;
}

/**
 * The Round Robin Tournament ID API response
 */
interface TournamentId {
    ids: string[]; // list of tournament ids in string
    message: string; // success/error message
}

export const cohorts = [
    { label: '0-300', value: 0 },
    { label: '300-400', value: 300 },
    { label: '400-500', value: 400 },
    { label: '500-600', value: 500 },
    { label: '600-700', value: 600 },
    { label: '700-800', value: 700 },
    { label: '800-900', value: 800 },
    { label: '900-1000', value: 900 },
    { label: '1000-1100', value: 1000 },
    { label: '1100-1200', value: 1100 },
    { label: '1200-1300', value: 1200 },
    { label: '1300-1400', value: 1300 },
    { label: '1400-1500', value: 1400 },
    { label: '1500-1600', value: 1500 },
    { label: '1600-1700', value: 1600 },
    { label: '1700-1800', value: 1700 },
    { label: '1800-1900', value: 1800 },
    { label: '1900-2000', value: 1900 },
    { label: '2000-2100', value: 2000 },
    { label: '2100-2200', value: 2100 },
    { label: '2200-2300', value: 2200 },
    { label: '2300-2400', value: 2300 },
];

const endpoint = getConfig().api.roundRobinUrl;

/**
 * method to fetch tournament ids for given cohort start value
 * @param cohortValue int type of cohort value
 * @returns list of tournament ids
 */

export const fetchTournamentIds = async (cohortValue: number): Promise<string[]> => {
    try {
        const response = await axios.get<TournamentId>(`${endpoint}/tournamentid`, {
            params: {
                'cohort-start': cohortValue,
            },
        });

        const ids: string[] = response.data.ids;
        return ids ?? [];
    } catch (error) {
        console.error('Error fetching tournament IDs:', error);
        throw error;
    }
};

/**
 * method to fetch round robin tournament data from given tournament id
 * @param id string tournament id
 * @returns tournamentData object
 */

export const fetchTournamentData = async (id: string): Promise<TournamentData> => {
    try {
        const response = await axios.get<TournamentData>(`${endpoint}/info`, {
            params: {
                tournamentid: id,
            },
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching tournament data:', error);
        throw error;
    }
};


export const registerUser = async (cohortValue: number, discordName: string, discordId: string, lichessName: string, chessComName: string, dojoUsername: string): Promise<string> => {
    try {
        const response = await axios.post<RoundRobinApi>(`${endpoint}`, {
            params: {
                'mode': 'register',
                'cohortstart': cohortValue,
                'discordname': discordName,
                'discordid': discordId,
                'lichessname': lichessName,
                'chesscomname': chessComName,
                'dojousername': dojoUsername
            },
        });

        return response.data.message;
    } catch (error) {
        console.error('Round robin user registration error!', error);
        throw error;
    }
};

export const withdrawUser = async (discordName: string, dojoUsername: string): Promise<string> => {
    try {
        const response = await axios.post<RoundRobinApi>(`${endpoint}`, {
            params: {
                'mode': 'withdraw',
                'discordname': discordName,
                'dojousername': dojoUsername
            },
        });

        return response.data.message;
    } catch (error) {
        console.error('Round robin user withdraw error!', error);
        throw error;
    }
};


export const submitGameFromUser = async (discordName: string, dojoUsername: string, gameURL: string): Promise<string> => {
    try {
        const response = await axios.post<RoundRobinApi>(`${endpoint}`, {
            params: {
                'mode': 'game',
                'discordname': discordName,
                'dojousername': dojoUsername,
                'gameurl': gameURL,
            },
        });

        return response.data.message;
    } catch (error) {
        console.error('Round robin user game submission error!', error);
        throw error;
    }
};

