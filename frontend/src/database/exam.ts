
/** The type of an exam. */
export enum ExamType {
    Tactics = 'TACTICS_EXAM',
    Polgar = 'POLGAR_EXAM',
    Endgame = 'ENDGAME_EXAM',
    Positional = 'POSITIONAL_EXAM',
}


export { ExamType } from '@jackstenglein/chess-dojo-common/src/database/exam';

/**
 * Returns a display string for the given Exam type.
 * @param type The type of the Exam.
 * @returns A display string for the Exam type.
 */
export function displayExamType(type: ExamType): string {
    switch (type) {
        case ExamType.Tactics:
            return 'Tactics Test';
        case ExamType.Polgar:
            return 'Checkmate Test';
        case ExamType.Endgame:
            return 'Endgame Test';
        case ExamType.Positional:
            return 'Positional Test';    
            
    }
}
