export interface Availability {
    owner: string;
    ownerDisplayName: string;
    // ownerDiscord: string;
    ownerCohort: string;
    ownerPreviousCohort: string;
    id: string;
    startTime: string;
    endTime: string;
    types: AvailabilityType[];
    cohorts: string[];
    location: string;
    description: string;
    status: AvailabilityStatus;
    maxParticipants: number;
    participants: Participant[];
    discordMessageId: string;
}

export interface Participant {
    username: string;
    displayName: string;
    cohort: string;
    previousCohort: string;
}

export enum AvailabilityStatus {
    Scheduled = 'SCHEDULED',
    Booked = 'BOOKED',
    Canceled = 'CANCELED',
}

export enum AvailabilityType {
    ClassicalGame = 'CLASSICAL_GAME',
    OpeningSparring = 'OPENING_SPARRING',
    MiddlegameSparring = 'MIDDLEGAME_SPARRING',
    EndgameSparring = 'ENDGAME_SPARRING',
    RookEndgameProgression = 'ROOK_ENDGAME_PROGRESSION',
    ClassicAnalysis = 'CLASSIC_ANALYSIS',
    AnalyzeOwnGame = 'ANALYZE_OWN_GAME',
    BookStudy = 'BOOK_STUDY',
}

export function getDisplayString(type: AvailabilityType | null | undefined): string {
    if (!type) {
        return '';
    }

    switch (type) {
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
    }
}

export function getDefaultNumberOfParticipants(type: AvailabilityType): number {
    switch (type) {
        case AvailabilityType.ClassicalGame:
            return 1;
        case AvailabilityType.OpeningSparring:
            return 1;
        case AvailabilityType.MiddlegameSparring:
            return 1;
        case AvailabilityType.EndgameSparring:
            return 1;
        case AvailabilityType.RookEndgameProgression:
            return 1;
        case AvailabilityType.ClassicAnalysis:
            return 4;
        case AvailabilityType.AnalyzeOwnGame:
            return 4;
        case AvailabilityType.BookStudy:
            return 4;
    }
}
