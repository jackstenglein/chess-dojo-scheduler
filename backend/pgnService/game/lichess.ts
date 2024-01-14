import axios from 'axios';

import { ApiError } from './errors';

export async function getLichessChapter(url?: string): Promise<string> {
    if (!url) {
        throw new ApiError({
            statusCode: 400,
            publicMessage:
                'Invalid request: url is required when importing from Lichess chapter',
        });
    }

    const response = await axios.get<string>(`${url}.pgn?source=true`);
    console.log('Get lichess chapter URL resp: %j', response);
    return response.data;
}

export async function getLichessStudy(url?: string): Promise<string[]> {
    if (!url) {
        throw new ApiError({
            statusCode: 400,
            publicMessage:
                'Invalid request: url is required when importing from Lichess study',
        });
    }

    const response = await axios.get<string>(`${url}.pgn?source=true`);
    const games = response.data.split('\n\n\n[');
    return games
        .map((g, i) => {
            g = g.trim();
            if (!g) {
                return g;
            }
            if (i === 0) {
                return g;
            }
            return `[${g}`;
        })
        .filter((v) => v !== '');
}
