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

    try {
        const response = await axios.get<string>(`${url}.pgn?source=true`);
        return response.data;
    } catch (err) {
        if (err.response?.status === 401) {
            throw new ApiError({
                statusCode: 400,
                publicMessage:
                    'Invalid request: Lichess study must be public or unlisted',
                cause: err,
            });
        }
        throw err;
    }
}

export async function getLichessStudy(url?: string): Promise<string[]> {
    if (!url) {
        throw new ApiError({
            statusCode: 400,
            publicMessage:
                'Invalid request: url is required when importing from Lichess study',
        });
    }

    try {
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
    } catch (err) {
        if (err.response?.status === 401) {
            throw new ApiError({
                statusCode: 400,
                publicMessage:
                    'Invalid request: Lichess study must be public or unlisted',
                cause: err,
            });
        }
        throw err;
    }
}
