export enum SourceType {
    Chesscom = 'chesscom',
    Lichess = 'lichess',
}

export interface PlayerSource {
    type: SourceType;
    username: string;
    hasError?: boolean;
    error?: string;
    hidden?: boolean;
}

export const DEFAULT_PLAYER_SOURCE: PlayerSource = {
    type: SourceType.Chesscom,
    username: '',
} as const;

export enum Color {
    White = 'white',
    Black = 'black',
    Both = 'both',
}

export interface GameFilters {
    color: Color;
    win: boolean;
    draw: boolean;
    loss: boolean;
    rated: boolean;
    casual: boolean;
    bullet: boolean;
    blitz: boolean;
    rapid: boolean;
    classical: boolean;
    daily: boolean;
    opponentRating: [number, number];
    downloadLimit: number;
    dateRange: [string, string];
    plyCount: [number, number];
    hiddenSources: PlayerSource[];
}

export const MIN_DOWNLOAD_LIMIT = 100;
export const MAX_DOWNLOAD_LIMIT = 2000;
export const MIN_PLY_COUNT = 2;
export const MAX_PLY_COUNT = 300;
