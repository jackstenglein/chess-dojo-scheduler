import { getConfig } from '@/config';
import axios from 'axios';

export interface RoundRobinModel {
    id: string; // tournament id
    name: string; // name
    pairingdata: string[][]; // pairings
    desc: string; // tournament desc
    crosstabledata: string[][]; // raw crosstable data
    players: string[]; // players
    gameSub: string[]; // game submissions
    tc: number; // time control
    inc: number; // time increment 
    fen: string; // fen yea we can run chess960 tournaments lol
    status: string; // tournament status
    startdate: Date; // start date of tournament 
    enddate: Date; // end date of tournament
    waiting: boolean; // is waiting list?
    scoremap: {[key: string]: number }; // hashmappa for leaderboard (joma tech reference)
}


interface RoundRobinPlayerApi{
    message: string;
}

/**
 * The Round Robin Tournament ID API response
 */
export interface TournamentId {
    tournaments: RoundRobinModel[]; // list of tournament ids in string
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
const localendpoint = 'endpoint/Prod/player';
/**
 * method to fetch round robin tournament data from given tournament id
 * @param id string tournament id
 * @returns tournamentData object
 */

export const fetchTournamentData = async (cohortValue: number): Promise<TournamentId> => {
    try {
        const response = await axios.get<TournamentId>(endpoint + `/Prod/tournamentid`, {
            params: {
                'cohort-start': cohortValue,
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
        const response = await axios.get<RoundRobinPlayerApi>(`${localendpoint}`, {
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
        const response = await axios.get<RoundRobinPlayerApi>(`${localendpoint}`, {
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
        const response = await axios.get<RoundRobinPlayerApi>(`${localendpoint}`, {
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

