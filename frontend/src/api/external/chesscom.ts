import axios from 'axios';
import { useCallback } from 'react';
import { Request, useRequest } from '../Request';

export interface ChesscomGame {
    url: string;
    pgn: string;
    time_control: string;
    end_time: number;
    rated: boolean;
    uuid: string;
    time_class: ChesscomTimeClass;
    rules: string;
    white: ChesscomGamePlayer;
    black: ChesscomGamePlayer;
}

export interface ChesscomGamePlayer {
    rating: number;
    result: ChesscomGameResult;
    username: string;
    uuid: string;
}

export enum ChesscomTimeClass {
    Rapid = 'rapid',
    Blitz = 'blitz',
    Bullet = 'bullet',
    Daily = 'daily',
}

export enum ChesscomGameResult {
    Win = 'win',
    Resigned = 'resigned',
    Checkmated = 'checkmated',
    Timeout = 'timeout',
    DrawAgreement = 'agreed',
    Abandonded = 'abandoned',
    InsufficientMaterial = 'insufficient',
    Repetition = 'repetition',
}

interface ExportUserGamesParams {
    /**
     * The username of the player.
     */
    username: string;

    /** A list of timeframes to fetch games for. */
    timeframes: {
        /** The year to get games for. */
        year: string;

        /** The month to get games for. */
        month: string;
    }[];
}

interface ChesscomGamesResponse {
    games: ChesscomGame[];
}

/**
 * A hook to fetch Chess.com games.
 * @returns The list of games, a callback to fetch games and the request object.
 */
export function useChesscomGames(): [
    ChesscomGame[] | undefined,
    (params: ExportUserGamesParams, force?: boolean) => void,
    Request<ChesscomGame[]>,
] {
    const request = useRequest<ChesscomGame[]>();

    const requestGames = useCallback(
        (params: ExportUserGamesParams, force?: boolean) => {
            if (!force && request.isSent()) {
                return;
            }

            request.onStart();

            const games = params.timeframes.map((t) =>
                axios
                    .get<ChesscomGamesResponse>(
                        `https://api.chess.com/pub/player/${params.username}/games/${t.year}/${t.month}`,
                    )
                    .then((resp) => resp.data.games),
            );

            Promise.all(games)
                .then((resp) => {
                    request.onSuccess(resp.flat());
                })
                .catch((err: unknown) => {
                    console.log('Failed to get Chesscom games: ', err);
                    request.onFailure(err);
                });
        },
        [request],
    );

    return [request.data, requestGames, request];
}
