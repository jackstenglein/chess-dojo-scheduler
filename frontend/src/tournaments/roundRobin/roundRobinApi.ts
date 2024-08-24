
import axios from "axios";

export interface TournamentData {
    info: string;
    tournamentname: string;
    pairs: string[][];
    message: string;
    desc: string;
    crosstable: string[][];
    crosstableString: string;
    leaderboard: string[];
    players: string[];
    gameSub: string[];
    statusCode: number;
}

interface TournamentId{
    id: string;
    message: string;
}

export const cohorts = [
    { label: '0-300', value: 0},
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

const authToken = process.env.NEXT_ROUND_ROBIN_AUTH; 
const endpoint = process.env.NEXT_ROUND_ROBIN_API;

export const fetchTournamentIds = async (cohortValue: number): Promise<string[]> => {
    try {
        console.log(endpoint);
        const response = await axios.get(endpoint + '/tournamentid?cohort-start=' + cohortValue, {
            headers: {
                Authorization: authToken,
            },
            
        });


        const idsString: string = response.data.id;
        const ids: string[] = idsString.replace(/[\[\]]/g, '').split(',');

        return ids;
    } catch (error) {
        console.error('Error fetching tournament IDs:', error);
        throw error;
    }
};

export const fetchTournamentData = async (id: string): Promise<TournamentData> => {
    try {
        const response = await axios.get(endpoint + `/info?tournamentid=` + id, {
            headers: {
                Authorization: authToken,
            },
        });

        return response.data as TournamentData;
    } catch (error) {
        console.error('Error fetching tournament data:', error);
        throw error;
    }
};