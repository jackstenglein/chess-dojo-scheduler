export enum EventType {
    Availability = 'AVAILABILITY',
    Dojo = 'DOJO',
    LigaTournament = 'LIGA_TOURNAMENT',
    Coaching = 'COACHING',
}

export interface Event {
    id: string;
    type: EventType;
    owner: string;
    ownerDisplayName: string;
    ownerCohort: string;
    ownerPreviousCohort: string;
    title: string;
    startTime: string;
    endTime: string;
    types?: AvailabilityType[];
    bookedStartTime: string;
    bookedType: AvailabilityType;
    cohorts: string[];
    status: EventStatus;
    location: string;
    description: string;
    maxParticipants: number;
    participants: Record<string, Participant>;
    /** A list of users invited to the event. */
    invited?: Participant[];
    /** Whether the event can only be booked by people invited. */
    inviteOnly?: boolean;
    discordMessageId: string;
    privateDiscordEventId: string;

    /** Whether to hide the Event from the public Discord server. */
    hideFromPublicDiscord: boolean;

    /** The ID of the public Discord guild event for this Event. */
    publicDiscordEventId: string;

    /** The LigaTournament information for this event. Only present for LigaTournaments. */
    ligaTournament?: LigaTournament;

    /** The coaching information for this event. Only present for EventType.Coaching. */
    coaching?: Coaching;

    /** Messages on the meeting. */
    messages?: Comment[];

    /** The recurrence rule of the event, as a string. */
    rrule?: string;
}

export enum AvailabilityType {
    AllTypes = 'ALL_TYPES',
    ClassicalGame = 'CLASSICAL_GAME',
    OpeningSparring = 'OPENING_SPARRING',
    MiddlegameSparring = 'MIDDLEGAME_SPARRING',
    EndgameSparring = 'ENDGAME_SPARRING',
    RookEndgameProgression = 'ROOK_ENDGAME_PROGRESSION',
    ClassicAnalysis = 'CLASSIC_ANALYSIS',
    AnalyzeOwnGame = 'ANALYZE_OWN_GAME',
    BookStudy = 'BOOK_STUDY',
    Lesson = 'LESSON',
}

export enum EventStatus {
    Scheduled = 'SCHEDULED',
    Booked = 'BOOKED',
    Canceled = 'CANCELED',
}

export interface Participant {
    username: string;
    displayName: string;
    cohort: string;
    previousCohort: string;

    /** Whether the user has successfully paid. Only relevant for EventType.Coaching. */
    hasPaid?: boolean;
}

export interface LigaTournament {
    // The type of the tournament (IE: Swiss or Arena)
    type: TournamentType;

    // The Lichess id of the tournament
    id: string;

    // Whether the tournament is rated or not
    rated: boolean;

    // The time control type of the tournament (blitz, rapid, classical)
    timeControlType: TimeControlType;

    // The initial time limit in seconds
    limitSeconds: number;

    // The time increment in seconds
    incrementSeconds: number;

    // The FEN of the starting position, if the tournament uses a custom position
    fen?: string;

    // The Lichess URL of the tournament
    url: string;

    // The number of rounds in the tournament. Only present for Swiss tournaments.
    numRounds?: number;

    // The current round this LigaTournament object refers to. Only present for Swiss tournaments.
    currentRound?: number;
}

export interface Coaching {
    /** The coach's Stripe id. */
    stripeId: string;

    /** The normal full price of the coaching session, in cents. */
    fullPrice: number;

    /**
     * The current price of the coaching session, in cents. If non-positive,
     * fullPrice is used instead.
     */
    currentPrice: number;

    /** Whether the coaching session is bookable by free users. */
    bookableByFreeUsers: boolean;

    /** Whether to hide the participant list until the session is booked. */
    hideParticipants: boolean;
}

export enum TournamentType {
    AllTournamentTypes = 'ALL_TOURNAMENT_TYPES',
    Swiss = 'SWISS',
    Arena = 'ARENA',
}

export enum TimeControlType {
    AllTimeContols = 'ALL_TIME_CONTROLS',
    Blitz = 'BLITZ',
    Rapid = 'RAPID',
    Classical = 'CLASSICAL',
}

/**
 * Converts the given AvailabilityType to a user-facing display string.
 * @param type The type to convert.
 */
export function availabilityTypeString(type: AvailabilityType | null | undefined): string {
    if (!type) {
        return '';
    }

    switch (type) {
        case AvailabilityType.AllTypes:
            return 'All Types';
        case AvailabilityType.ClassicalGame:
            return 'Classical Game';
        case AvailabilityType.OpeningSparring:
            return 'Opening Sparring';
        case AvailabilityType.MiddlegameSparring:
            return 'Middlegame Sparring';
        case AvailabilityType.EndgameSparring:
            return 'Endgame Sparring';
        case AvailabilityType.RookEndgameProgression:
            return 'Rook Endgame Progression';
        case AvailabilityType.ClassicAnalysis:
            return 'Analyze Classic Game';
        case AvailabilityType.AnalyzeOwnGame:
            return 'Analyze Own Game';
        case AvailabilityType.BookStudy:
            return 'Book Study';
        case AvailabilityType.Lesson:
            return 'Lesson/Lecture';
    }
}
