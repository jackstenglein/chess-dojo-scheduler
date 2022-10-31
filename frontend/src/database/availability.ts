export interface Availability {
    owner: string;
    ownerCohort: string;
    id: string;
    startTime: string;
    endTime: string;
    types: string[];
    cohorts: string[];
}

// export const availabilityTypes = [
//     'CLASSICAL_GAME',
//     'OPENING_SPARRING',
//     'MIDDLEGAME_SPARRING',
//     'ENDGAME_SPARRING',
//     'ROOK_ENDGAME_PROGRESSION',
//     'CLASSICAL_ANALYSIS',
//     'BOOK_STUDY',
// ];

export enum AvailabilityType {
    ClassicalGame = 'CLASSICAL_GAME',
    OpeningSparring = 'OPENING_SPARRING',
    MiddlegameSparring = 'MIDDLEGAME_SPARRING',
    EndgameSparring = 'ENDGAME_SPARRING',
    RookEndgameProgression = 'ROOK_ENDGAME_PROGRESSION',
    ClassicAnalysis = 'CLASSIC_ANALYSIS',
    BookStudy = 'BookStudy',
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
    }
}
