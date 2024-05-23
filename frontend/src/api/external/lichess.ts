import axios, { Method } from 'axios';
import { useCallback, useState } from 'react';
import { Request, useRequest } from '../Request';

type GamePlayers = Record<
    'white' | 'black',
    {
        user: {
            name: string;
            title?: string;
            patron?: boolean;
            id: string;
        };
        // Datatype of rating appears to be a number, but unsure of edge cases
        rating?: number | string;
        ratingDiff?: number;
    }
>;

interface Opening {
    eco: string;
    name: string;
    ply: number;
}

interface Clock {
    initial: number;
    increment: number;
    totalTime: number;
}

export interface LichessGame {
    id: string;
    rated: boolean;
    variant: string;
    speed: LichessSpeedType;
    perf: LichessPerfType;
    createdAt: number;
    lastMoveAt: number;
    status: string;
    players: GamePlayers;
    opening: Opening;
    moves: string;
    clock: Clock;
    pgn: string;
}

export enum LichessPerfType {
    UltraBullet = 'ultraBullet',
    Bullet = 'bullet',
    Blitz = 'blitz',
    Rapid = 'rapid',
    Classical = 'classical',
    Correspondence = 'correspondence',
    Chess960 = 'chess960',
    Crazyhouse = 'crazyhouse',
    Antichess = 'antichess',
    Atomic = 'atomic',
    Horde = 'horde',
    KingOfTheHill = 'kingOfTheHill',
    RacingKings = 'racingKings',
    ThreeCheck = 'threeCheck',
}

export enum LichessSpeedType {
    UltraBullet = 'ultraBullet',
    Bullet = 'bullet',
    Blitz = 'blitz',
    Rapid = 'rapid',
    Classical = 'classical',
    Correspondence = 'correspondence',
}

/**
 * Settings for exporting games.
 */
interface ExportUserGamesParams {
    /**
     * Username of the player whose games you should export.
     */
    username: string;

    /**
     * Download games played since this timestamp. Defaults to account creation date.
     */
    since?: number;

    /**
     * Download games played until this timestamp. Defaults to now.
     */
    until?: number;

    /**
     * How many games to download. WARNING: Defaults to all!
     */
    max?: number;

    /**
     * Only games played against this opponent.
     */
    vs?: string;

    /**
     * Only rated (true) or casual (false) games.
     */
    rated?: boolean;

    /**
     * Only games in these speeds or variants. Multiple perf types can be specified, separated by a comma.
     * Example: blitz,rapid,classical
     */
    perfType?: string;

    /**
     * Only games played as this color.
     */
    color?: 'white' | 'black';

    /**
     * Only games with or without a computer analysis available.
     */
    analysed?: boolean;

    /**
     * Include the PGN moves.
     *
     * Default: true
     */
    moves?: boolean;

    /**
     * Include the full PGN within the JSON response, in a pgn field. The response type must be set to
     * application/x-ndjson by the request Accept header.
     *
     * Default: true
     */
    pgnInJson?: boolean;

    /**
     * Include the PGN tags.
     *
     * Default: true
     */
    tags?: boolean;

    /**
     * Include clock status when available. Either as PGN comments or in a clocks JSON field, as centisecond integers, depending on the response type.
     *
     * Default: true.
     */
    clocks?: boolean;

    /**
     * Include analysis evaluations and comments, when available. Either as PGN comments or in an analysis JSON field, depending on the response type.
     *
     * Default: false
     */
    evals?: boolean;

    /**
     * Include accuracy percent of each player, when available.
     *
     * Default: false
     */
    accuracy?: boolean;

    /**
     * Include the opening name. Example: [Opening "King's Gambit Accepted, King's Knight Gambit"]
     *
     * Default: true
     */
    opening?: boolean;

    /**
     * Plies which mark the beginning of the middlegame and endgame. Only available in JSON.
     */
    division?: boolean;

    /**
     * Ongoing games are delayed by a few seconds ranging from 3 to 60 depending on the time control, as to prevent cheat bots from using this API.
     *
     * Default: false
     */
    ongoing?: boolean;

    /**
     * Include finished games. Set to false to only get ongoing games.
     */
    finished?: boolean;

    /**
     * Insert textual annotations in the PGN about the opening, analysis variations, mistakes, and game termination.
     */
    literate?: boolean;

    /**
     * Include the FEN notation of the last position of the game. The response type must be set to application/x-ndjson by the request Accept header.
     */
    lastFen?: boolean;

    /**
     * URL of a text file containing real names and ratings, to replace Lichess usernames and ratings in the PGN.
     * Example: https://gist.githubusercontent.com/ornicar/6bfa91eb61a2dcae7bcd14cce1b2a4eb/raw/768b9f6cc8a8471d2555e47ba40fb0095e5fba37/gistfile1.txt
     */
    players?: string;

    /**
     * Sort order of the games. Default: "dateDesc". Enum: "dateAsc" "dateDesc".
     */
    sort?: 'dateAsc' | 'dateDesc';
}

export interface LichessExportGamesResponse {
    data: LichessGame[];
}

export function useLichessUserGames(): [
    LichessGame[] | undefined,
    (params: ExportUserGamesParams, force?: boolean) => void,
    Request<LichessExportGamesResponse>,
] {
    const request = useRequest<LichessExportGamesResponse>();
    const [games, setGames] = useState<LichessGame[]>();

    const requestGames = useCallback(
        (params: ExportUserGamesParams, force?: boolean) => {
            if (
                !force &&
                (request.isLoading() || request.data !== undefined || games !== undefined)
            ) {
                return;
            }

            request.onStart();

            lichessApi
                .exportUserGames(params)
                .then((resp) => {
                    request.onSuccess();
                    setGames(resp.data);
                })
                .catch((err: unknown) => {
                    request.onFailure(err);
                });
        },
        [request, games],
    );

    return [games, requestGames, request];
}

export const lichessApi = {
    exportUserGames: (params: ExportUserGamesParams) =>
        requestLichessNDJson<ExportUserGamesParams, LichessExportGamesResponse>({
            params: {
                clocks: true,
                evals: false,
                pgnInJson: true,
                opening: true,
                accuracy: false,
                ...params,
            },
            method: 'GET',
            endpoint: `/api/games/user/${params.username}`,
        }),
};

function requestLichessNDJson<T, R>({
    endpoint,
    data,
    params,
    method,
}: {
    endpoint: string;
    method: Method;
    params?: T;
    data?: T;
}): Promise<R> {
    return new Promise<R>((resolve, reject) => {
        axios
            .request<T, { data: string }>({
                method,
                data,
                params,
                url: `https://lichess.org${endpoint}`,
                headers: {
                    Accept: 'application/x-ndjson',
                },
            })
            .then((resp) => {
                // Here be dragons - type-safety out the window.
                const parsedResp = {
                    data: resp.data
                        .split('\n')
                        .filter((line) => line)
                        .map((line) => JSON.parse(line) as unknown),
                } as R;

                resolve(parsedResp);
            })
            .catch((err: unknown) => {
                let message = 'Unknown reason';

                if (err && typeof err === 'object' && 'message' in err) {
                    message = err.message as string;
                }

                const helpfulError = new Error(
                    `Failed to contact Lichess API: ${message}`,
                );

                reject(helpfulError);
            });
    });
}
