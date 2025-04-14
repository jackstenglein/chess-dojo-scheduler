import { splitPgns } from '@jackstenglein/chess-dojo-common/src/pgn/pgn';
import axios from 'axios';
import { ApiError } from 'chess-dojo-directory-service/api';
import { getPathSegment } from './helpers';

/**
 * Fetches the PGN of the given Lichess game.
 * @param url The URL of the Lichess game.
 * @returns The PGN of the Lichess game.
 */
export async function getLichessGame(url?: string): Promise<string> {
    // Lichess has a weird URL format for games, where the players get a special game ID
    // with extra characters at the end. Fetching this special game ID from the API results
    // in a 404, whereas truncating to only the first 8 characters will return the game.
    const gameId = getPathSegment(url, 0).substring(0, 8);

    try {
        const exportUrl = `https://lichess.org/game/export/${gameId}?evals=0&clocks=1`;
        const response = await axios.get<string>(exportUrl, {
            headers: { Accept: 'application/x-chess-pgn' },
        });
        return response.data;
    } catch (err: unknown) {
        handleError('Lichess Game', err);
        throw err;
    }
}

/**
 * Fetches the PGN of the given Lichess study chapter.
 * @param url The URL of the Lichess study chapter.
 * @returns The PGN of the chapter.
 */
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

/**
 * Fetches a list of the PGNs in the given Lichess study.
 * @param url The URL of the Lichess study.
 * @returns A list of the PGNs in the study.
 */
export async function getLichessStudy(url?: string): Promise<string[]> {
    const studyId = getPathSegment(url, 1);

    const exportUrl = `https://lichess.org/study/${studyId}.pgn?source=true`;
    try {
        const response = await axios.get<string>(exportUrl);
        return splitPgns(response.data);
    } catch (err) {
        handleError('Lichess Study', err);
        throw err;
    }
}

/**
 * Throws a descriptive ApiError based on the error received when fetching
 * data from Lichess.
 * @param requested A description of the requested Lichess entity.
 * @param err The error thrown when fetching the Lichess entity.
 */
function handleError(requested: string, err: unknown) {
    if (axios.isAxiosError(err) && err.response !== undefined) {
        const status = err.response.status;
        if (status === 403 || status == 401) {
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
