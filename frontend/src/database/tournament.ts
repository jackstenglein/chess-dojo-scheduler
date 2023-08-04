export enum TournamentType {
    Swiss = 'SWISS',
    Arena = 'ARENA',
    GrandPrix = 'GRAND_PRIX',
}

export interface Tournament {
    type: TournamentType;
    startsAt: string;
    id: string;
    name: string;
    description: string;
    rated: boolean;
    limitSeconds: number;
    incrementSeconds: number;
    fen?: string;
    url: string;
    lengthMinutes?: number;
    numRounds?: number;
}

export interface LeaderboardPlayer {
    username: string;
    rating: number;
    score: number;
}

export interface Leaderboard {
    type: string;
    startsAt: string;
    timeControl: 'blitz' | 'rapid' | 'classical';
    players: LeaderboardPlayer[];
}
