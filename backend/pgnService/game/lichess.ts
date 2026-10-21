import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { splitPgns } from '@jackstenglein/chess-dojo-common/src/pgn/pgn';
import axios, { AxiosRequestConfig } from 'axios';
import { ApiError } from '../../directoryService/api';
import { getPathSegment } from './helpers';

const secretsManager = new SecretsManagerClient({ region: 'us-east-1' });
let lichessToken: Promise<string | undefined> | undefined;

/**
 * Returns ChessDojo's Lichess API token, or undefined if it is not configured. Without it,
 * Lichess only exports games that are recent or between players rated 2200+ on average.
 */
function getLichessToken(): Promise<string | undefined> {
    lichessToken ??= secretsManager
        .send(
            new GetSecretValueCommand({
                SecretId: `chess-dojo-${process.env.stage}-lichessApiToken`,
            }),
        )
        .then((output) => output.SecretString || undefined)
        .catch((err: unknown) => {
            console.error('Failed to get the Lichess API token: ', err);
            return undefined;
        });
    return lichessToken;
}

/**
 * Returns the axios config for a Lichess export. Redirects are not followed, because
 * Lichess redirects the exports it refuses to its sign up page.
 * @param accept The Accept header to send, if any.
 */
async function getLichessConfig(accept?: string): Promise<AxiosRequestConfig> {
    const token = await getLichessToken();
    return {
        headers: {
            ...(accept ? { Accept: accept } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        maxRedirects: 0,
    };
}

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
        const response = await axios.get<string>(
            exportUrl,
            await getLichessConfig('application/x-chess-pgn'),
        );
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

    const exportUrl = `https://lichess.org/api/study/${studyId}/${chapterId}.pgn?source=true`;

    try {
        const response = await axios.get<string>(exportUrl, await getLichessConfig());
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

    const exportUrl = `https://lichess.org/api/study/${studyId}.pgn?source=true`;
    try {
        const response = await axios.get<string>(exportUrl, await getLichessConfig());
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
        } else if (status >= 300 && status < 400) {
            throw new ApiError({
                statusCode: 400,
                publicMessage: `${requested} can only be downloaded by signed-in users. Download its PGN from Lichess and import that instead.`,
                cause: err,
            });
        }
    }
}
