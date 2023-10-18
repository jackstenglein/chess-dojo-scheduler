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

export interface OpenClassicalPlayer {
    /** The Lichess username of the player. */
    lichessUsername: string;

    /** The Discord username of the player. */
    discordUsername: string;

    /** The player's title, if they have one. */
    title: string;

    /** The player's Lichess rating at the start of the Open Classical. */
    rating: number;
}

export interface OpenClassicalPairing {
    /** The player with the white pieces. */
    white: OpenClassicalPlayer;

    /** The player with the black pieces. */
    black: OpenClassicalPlayer;
}

export interface OpenClassicalRound {
    /** The list of pairings for the round. */
    pairings: OpenClassicalPairing[];
}

export interface OpenClassical {
    /**
     * The start of the period the tournament applies to, or CURRENT if this
     * is the current tournament.
     */
    startsAt: string;

    /** The rounds in the tournament. */
    rounds: OpenClassicalRound[];
}
