export enum SourceType {
    Chesscom = 'chesscom',
    Lichess = 'lichess',
}

export interface PlayerSource {
    type: SourceType;
    username: string;
    hasError?: boolean;
    error?: string;
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
}
