import axios from 'axios';

import { ApiError } from './errors';
import { getPathSegment } from './helpers';

export async function getLichessGame(url?: string): Promise<string> {
    const gameId = getPathSegment(url, 0);

    try {
        const exportUrl = `https://lichess.org/game/export/${gameId}?evals=0&clocks=1`;
        const response = await axios.get<string>(exportUrl, {
            headers: { Accept: 'application/x-chess-pgn' },
        });
        return response.data;
    } catch (err: unknown) {
        handleError('Lichess game', err);
        throw err;
    }
}

export async function getLichessChapter(url?: string): Promise<string> {
    const studyId = getPathSegment(url, 1);
    const chapterId = getPathSegment(url, 2);

    const exportUrl = `https://lichess.org/study/${studyId}/${chapterId}.pgn?source=true`;

    try {
        const response = await axios.get<string>(exportUrl);
        return response.data;
    } catch (err) {
        handleError('Lichess Study Chapter', err);
        throw err;
    }
}

export async function getLichessStudy(url?: string): Promise<string[]> {
    const studyId = getPathSegment(url, 1);

    const exportUrl = `https://lichess.org/study/${studyId}.pgn?source=true`;
    try {
        const response = await axios.get<string>(exportUrl);
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
        handleError('Lichess Study', err);
        throw err;
    }
}

function handleError(requested: string, err: unknown) {
    if (axios.isAxiosError(err) && err.response !== undefined) {
        const status = err.response.status;
        if (status === 401) {
            throw new ApiError({
                statusCode: 400,
                publicMessage: '',
                cause: err,
            });
        } else if (status === 403 || status == 401) {
            throw new ApiError({
                statusCode: 400,
                publicMessage: `${requested} settings forbid exporting.`,
                cause: err,
            });
        } else if (status === 404) {
            throw new ApiError({
                statusCode: 400,
                publicMessage: `${requested} not found.`,
                cause: err,
            });
        }
    }
}
