export interface Availability {
    owner: string;
    ownerDiscord: string;
    ownerCohort: string;
    id: string;
    startTime: string;
    endTime: string;
    types: AvailabilityType[];
    cohorts: string[];
    location: string;
    description: string;
}

export enum AvailabilityType {
    ClassicalGame = 'CLASSICAL_GAME',
    OpeningSparring = 'OPENING_SPARRING',
    MiddlegameSparring = 'MIDDLEGAME_SPARRING',
    EndgameSparring = 'ENDGAME_SPARRING',
    RookEndgameProgression = 'ROOK_ENDGAME_PROGRESSION',
    ClassicAnalysis = 'CLASSIC_ANALYSIS',
    BookStudy = 'BOOK_STUDY',
    AnalyzeOwnGame = 'ANALYZE_OWN_GAME',
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
        case AvailabilityType.BookStudy:
            return 'Book Study';
        case AvailabilityType.AnalyzeOwnGame:
            return 'Analyze Own Game'
    }
}
