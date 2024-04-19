/** A single problem in an exam. */
export interface ExamProblem {
    /** The side to move first in the problem. */
    orientation: 'white' | 'black';

    /** The FEN of the starting position. */
    fen: string;

    /** The PGN of the solution to the problem. */
    solution: string;
}

export enum ExamType {
    Tactics = 'TACTICS_EXAM',
    Scores = 'SCORES',
}

/**
 * A summary of a single user's answer to an exam. Stored on the exam to
 * facilitate calculating the exam's linear regression.
 */
export interface ExamAnswerSummary {
    /** The user's cohort, at the time they took the exam. */
    cohort: string;

    /** The user's normalized rating, at the time they took the exam. */
    rating: number;

    /** The user's score for the full exam. */
    score: number;

    /** The date the user took the exam, in time.RFC3339 format. */
    createdAt: string;
}

/** An exam consisting of multiple problems. */
export interface Exam {
    /** The hash key for the exam table. */
    type: ExamType;

    /** The v4 UUID of the exam. */
    id: string;

    /** The user-facing name of the exam. */
    name: string;

    /** A single problem in an exam. */
    problems: ExamProblem[];

    /** The max amount of time allowed to take the exam, in seconds. */
    timeLimitSeconds: number;

    /** The cohort range the exam applies to. */
    cohortRange: string;

    /** A map from username to ExamAnswerSummary. */
    answers: Record<string, ExamAnswerSummary>;

    /** The total score possible on the exam. */
    totalScore: number;
}

/** A single user's answer to an exam problem. */
export interface ExamProblemAnswer {
    /** The user's final result PGN. */
    pgn: string;

    /** The user's score for the problem. */
    score: number;

    /** The total score available for the problem. */
    total: number;
}

/** A single user's answer to a full exam. */
export interface ExamAnswer {
    /** The user's username. */
    type: string;

    /** The v4 UUID of the exam. */
    id: string;

    /** The type of the exam this answer refers to. */
    examType: ExamType;

    /** The user's answers to the problems included in the exam. */
    answers: ExamProblemAnswer[];

    /** The user's cohort, at the time they took the exam. */
    cohort: string;

    /** The user's normalized rating, at the time they took the exam. */
    rating: number;

    /** The amount of time used while taking the exam. */
    timeUsedSeconds: number;

    /** The date the user took the exam, in time.RFC3339 format. */
    createdAt: string;
}
