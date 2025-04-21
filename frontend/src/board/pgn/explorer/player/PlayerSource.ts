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
