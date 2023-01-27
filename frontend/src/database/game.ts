export enum GameResult {
    White = '1-0',
    Black = '0-1',
    Draw = '1/2-1/2',
}

export interface PgnHeaders {
    White: string;
    WhiteElo: string;
    Black: string;
    BlackElo: string;
    Date: string;
    Site: string;
    Result: GameResult;
    [key: string]: string;
}

export interface GameInfo {
    cohort: string;
    id: string;
    white: string;
    black: string;
    date: string;
    owner: string;
    headers: PgnHeaders;
}

export type Game = GameInfo & {
    pgn: string;
};
