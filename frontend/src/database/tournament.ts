export enum TournamentType {
    Swiss = 'SWISS',
    Arena = 'ARENA',
    GrandPrix = 'GRAND_PRIX',
    MiddlegameSparring = 'MIDDLEGAME_SPARRING',
    EndgameSparring = 'ENDGAME_SPARRING',
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
    players?: LeaderboardPlayer[];
}
