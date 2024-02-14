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

    /** The player's status in the open classical. */
    status: OpenClassicalPlayerStatus;
}

export enum OpenClassicalPlayerStatus {
    Active = '',
    Withdrawn = 'WITHDRAWN',
    Banned = 'BANNED',
}

export interface OpenClassicalPairing {
    /** The player with the white pieces. */
    white: OpenClassicalPlayer;

    /** The player with the black pieces. */
    black: OpenClassicalPlayer;

    /** The result of the pairing. */
    result: string;

    /** The URL of the game that was played. */
    gameUrl: string;

    /** Whether the result is verified. */
    verified: boolean;
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

    /** The name of the tournament. */
    name: string;

    /** Whether the tournament is accepting registrations or not. */
    acceptingRegistrations: boolean;

    /** The sections in the tournament. */
    sections: Record<string, OpenClassicalSection>;

    /** Players who are not in good standing and cannot register, mapped by their Lichess username. */
    bannedPlayers: Record<string, OpenClassicalPlayer>;
}

export interface OpenClassicalSection {
    /** The name of the section. */
    name: string;

    region: string;

    section: string;

    players: Record<string, OpenClassicalPlayer>;

    /** The rounds in the tournament for this section. */
    rounds: OpenClassicalRound[];
}
