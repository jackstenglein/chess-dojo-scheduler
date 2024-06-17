import { ExamType } from '@jackstenglein/chess-dojo-common/src/database/exam';

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
    }
}
