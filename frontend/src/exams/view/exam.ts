import { Chess, COLOR, Move } from '@jackstenglein/chess';
import { getSolutionScore } from '@jackstenglein/chess-dojo-common';
import { SimpleLinearRegression } from 'ml-regression-simple-linear';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '../../api/Api';
import { useRequest } from '../../api/Request';
import { Exam, ExamAnswer, ExamType } from '../../database/exam';
import { Requirement } from '../../database/requirement';
import {
    ALL_COHORTS,
    compareCohorts,
    isCohortGreater,
    isCohortInRange,
    isCohortLess,
    User,
} from '../../database/user';

/**
 * Fetches the exam and current user's answer based on the current page's
 * params. The page is expected to have type and id params.
 * @returns The type, id, request, exam and answer.
 */
export function useExam() {
    const { type, id } = useParams<{ type: ExamType; id: string }>();
    const api = useApi();
    const request = useRequest<{ exam: Exam; answer?: ExamAnswer }>();

    useEffect(() => {
        if (!request.isSent() && type && id) {
            request.onStart();
            api.getExam(type, id)
                .then((resp) => {
                    console.log('getExam: ', resp);
                    request.onSuccess(resp.data);
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [request, type, id, api]);

    return {
        request,
        type,
        id,
        exam: request.data?.exam,
        answer: request.data?.answer,
    };
}

/**
 * Returns the given cohort range as an array of 2 numbers. Ex: 0-1500
 * would return [0, 1500]. For ranges like 2000+, the max cohort is set to Infinity
 * (IE: [2000, Infinity]). If range is not provided or the min cohort is NaN, [-1, -1]
 * is returned.
 * @param range The cohort range to convert.
 * @returns The min and max cohort as numbers.
 */
export function getCohortRangeInt(range?: string): [number, number] {
    if (!range) {
        return [-1, -1];
    }

    const minCohort = parseInt(range);
    if (isNaN(minCohort)) {
        return [-1, -1];
    }

    let maxCohort =
        range.split('-').length > 1 ? parseInt(range.split('-')[1]) : Infinity;
    if (isNaN(maxCohort)) {
        maxCohort = Infinity;
    }

    return [minCohort, maxCohort];
}

/**
 * Returns the cohort range that is used to calculate the best fit line
 * of the exam. This is the exam's recommended cohort range +-100.
 * @param examRange The exam cohort range.
 * @returns The best fit cohort range.
 */
export function getBestFitCohortRange(examRange: string): string {
    let [minCohort, maxCohort] = getCohortRangeInt(examRange);
    minCohort = Math.max(0, minCohort - 100);
    maxCohort += 100;

    if (maxCohort === Infinity) {
        return `${minCohort}+`;
    }
    return `${minCohort}-${maxCohort}`;
}

/**
 * Returns the linear regression for this exam. If the exam has not been taken
 * by enough people, null is returned.
 * @param exam The exam to get the linear regression for.
 * @returns The linear regression, or null if the exam does not have enough answers.
 */
export function getRegression(exam: Exam): SimpleLinearRegression | null {
    const [minCohort, maxCohort] = getCohortRangeInt(exam.cohortRange);
    const answers = Object.values(exam.answers).filter((a) => {
        return (
            a.rating > 0 &&
            a.score > 0 &&
            a.rating >= minCohort - 100 &&
            a.rating < maxCohort + 100
        );
    });
    if (answers.length < 10) {
        return null;
    }

    const x = answers.map((a) => a.score);
    const y = answers.map((a) => a.rating);
    return new SimpleLinearRegression(x, y);
}

export function getMoveDescription({
    found,
    score,
    altFound,
}: {
    found?: boolean;
    score?: number;
    altFound?: boolean;
}): string {
    if (found) {
        if (score) {
            return `Great job finding this move! You earned ${score} point${score !== 1 ? 's' : ''}.`;
        }
        return `You found this move, but it's worth 0 points.`;
    }

    if (altFound) {
        if (score) {
            return `You found an alternative to this move. You earned ${score} point${score !== 1 ? 's' : ''}.`;
        }
        return `You found an alternative to this move, but it's worth 0 points.`;
    }

    if (score) {
        return `You didn't find this move and lost ${score} point${score !== 1 ? 's' : ''}.`;
    }
    return `You didn't find this move, but it's worth 0 points.`;
}

/**
 * Returns the starting position FEN from the given PGN.
 * @param pgn The PGN to get the FEN for.
 */
export function getFen(pgn: string): string {
    const fenIndex = pgn.indexOf('[FEN "');
    const endFenIndex = pgn.indexOf('"]', fenIndex);
    return pgn.substring(fenIndex, endFenIndex).replace('[FEN "', '');
}

/**
 * Returns the starting orientation from the given PGN.
 * @param pgn The PGN to get the orientation for.
 */
export function getOrientation(pgn: string): 'white' | 'black' {
    const fen = getFen(pgn);
    const tokens = fen.split(' ');
    const color = tokens[1];
    if (color === 'b') {
        return 'black';
    }
    return 'white';
}

/**
 * Returns the Event header from the given PGN.
 * @param pgn The PGN to get the Event header from.
 */
export function getEventHeader(pgn: string): string {
    const eventIndex = pgn.indexOf('[Event "');
    if (eventIndex < 0) {
        return '';
    }
    const endEventIndex = pgn.indexOf('"]', eventIndex);
    if (endEventIndex < 0) {
        return '';
    }
    return pgn.substring(eventIndex, endEventIndex).replace('[Event "', '');
}

/**
 * Gets the total score for the given PGN problem in an exam.
 * @param pgn The PGN to get the score for.
 */
export function getTotalScore(pgn: string): number {
    const chess = new Chess({ pgn });
    chess.seek(null);
    return getSolutionScore(
        chess.turn() === COLOR.black ? 'black' : 'white',
        chess.history(),
        chess,
        false,
    );
}

/**
 * Adds extra variations present in the given answer but not the solution to the solution.
 * Each move in the extra variation has its userData.extra field set to true.
 * @param answer The user's answer to the tactics test.
 * @param currentSolutionMove The current move to start from in the solution.
 * @param solution The solution's Chess instance.
 */
export function addExtraVariation(
    answer: Move[],
    currentSolutionMove: Move | null,
    solution: Chess,
) {
    for (let move of answer) {
        if (move.variations.length > 0) {
            for (let variation of move.variations) {
                addExtraVariation(variation, currentSolutionMove, solution);
            }
        }

        let existingMove = solution.move(
            move.san,
            currentSolutionMove,
            false,
            true,
            true,
        );
        if (!existingMove) {
            existingMove = solution.move(
                move.san,
                currentSolutionMove,
                false,
                false,
                true,
            );
            if (!existingMove) {
                // This only happens if the user's answer has an invalid move.
                // IE: the test changed since they took it. In that case, we break, since
                // none of the following moves can be valid either.
                break;
            }

            existingMove.userData = {
                extra: true,
            };
        }
        currentSolutionMove = existingMove;
    }
}

const PuzzleRush5MinReqId = '42804d40-3651-438c-a8ae-e2200fe23b4c';
const PuzzleSurvivalReqId = 'fa98ad32-219a-4ee9-ae02-2cda69efce06';

export interface TacticsRating {
    /** The user's overall tactics rating. */
    overall: number;

    /** A list of components making up the tactics rating. */
    components: TacticsRatingComponent[];
}

export interface TacticsRatingComponent {
    /** The name of the component. */
    name: string;

    /** The user's rating for this specific component. If negative, the user doesn't have a rating for this component. */
    rating: number;

    /** A description of the component to be displayed to users. */
    description: string;
}

/**
 * Calculates the user's tactics rating.
 *
 * @param user The user to calculate the tactics rating for.
 * @param requirements A list of requirements, which should contain the Polgar Mate requirements
 * and the Puzzle Rush requirements.
 * @returns The user's tactics rating.
 */
export function calculateTacticsRating(
    user: User,
    requirements: Requirement[],
): TacticsRating {
    const rating: TacticsRating = {
        overall: 0,
        components: [],
    };

    if (isCohortLess(user.dojoCohort, '2100-2200')) {
        rating.components.push(...getExamRating(user, ExamType.Polgar));
    }

    if (isCohortLess(user.dojoCohort, '1700-1800')) {
        rating.components.push({
            name: 'PR 5 Min',
            rating: getTaskRating(
                user,
                requirements.find((r) => r.id === PuzzleRush5MinReqId),
            ),
            description: 'Based on progress on the Puzzle Rush 5 Min task',
        });
    }

    if (isCohortLess(user.dojoCohort, '2100-2200')) {
        rating.components.push({
            name: 'PR Survival',
            rating: getTaskRating(
                user,
                requirements.find((r) => r.id === PuzzleSurvivalReqId),
            ),
            description: 'Based on progress on the Puzzle Rush Survival task',
        });
    }

    if (isCohortGreater(user.dojoCohort, '1400-1500')) {
        rating.components.push(...getExamRating(user, ExamType.Tactics));
    }

    const countedComponents = rating.components.filter((c) => c.rating >= 0);
    if (countedComponents.length > 0) {
        rating.overall =
            countedComponents.reduce((sum, c) => sum + c.rating, 0) /
            countedComponents.length;
    }

    return rating;
}

/**
 * Calculates the user's rating for a given requirement.
 * @param user The user to calculate the rating for.
 * @param req The requirement to calculate the rating for.
 * @returns The user's rating for the given requirement.
 */
function getTaskRating(user: User, req?: Requirement): number {
    if (!req) {
        return -1;
    }

    const progress = user.progress[req.id];
    if (!progress) {
        return -1;
    }

    const count = progress.counts[ALL_COHORTS];
    if (!count) {
        return -1;
    }

    const reqCounts = Object.entries(req.counts).sort((lhs, rhs) =>
        compareCohorts(lhs[0], rhs[0]),
    );

    for (let i = 0; i < reqCounts.length; i++) {
        const [cohort, reqCount] = reqCounts[i];
        if (reqCount >= count) {
            const tokens = cohort.split('-');
            const minCohort = parseInt(tokens[0]);
            const maxCohort = parseInt(tokens[1] || '2500');

            const minReqCount = i ? reqCounts[i - 1][1] : req.startCount;

            const rating =
                ((maxCohort - minCohort) / (reqCount - minReqCount)) *
                    (count - minReqCount) +
                minCohort;
            return rating;
        }
    }

    return getTaskMaxRating(req);
}

/**
 * Returns the max possible rating for the given requirement.
 * @param req The requirement to get the max rating for.
 * @returns The max possible rating for the requirement.
 */
function getTaskMaxRating(req: Requirement): number {
    const reqCounts = Object.entries(req.counts).sort((lhs, rhs) =>
        compareCohorts(lhs[0], rhs[0]),
    );

    for (let i = reqCounts.length - 1; i > 0; i--) {
        if (reqCounts[i][1] !== reqCounts[i - 1][1]) {
            break;
        }
        reqCounts.pop();
    }

    const tokens = reqCounts[reqCounts.length - 1][0].split('-');
    return parseInt(tokens[1] || '2500');
}

/**
 * Gets the exam rating component for the given user.
 * @param user The user to get the rating component for.
 * @param examType The type of exam to get the rating for.
 * @returns The exam rating component.
 */
function getExamRating(user: User, examType: ExamType): TacticsRatingComponent[] {
    const numberOfExams = 3;
    const countedExams = Object.values(user.exams || {})
        .filter(
            (e) =>
                e.examType === examType &&
                // If a user is above the cohort range for a series of tests,
                // we don't count it, as it could potentially give them an inflated score.
                (isCohortInRange(user.dojoCohort, e.cohortRange) ||
                    isCohortLess(user.dojoCohort, e.cohortRange)),
        )
        .sort((lhs, rhs) => rhs.createdAt.localeCompare(lhs.createdAt))
        .slice(0, numberOfExams);

    if (isCohortLess(user.dojoCohort, '2100-2200')) {
        let rating = -1;
        if (countedExams.length > 0) {
            rating =
                countedExams.reduce((sum, e) => sum + e.rating, 0) / countedExams.length;
        }

        return [
            {
                name: `${displayExamType(examType)}s`,
                rating,
                description: `The average of the 3 most recent ${displayExamType(examType)} ratings`,
            },
        ];
    }

    return [
        {
            name: 'Test 1',
            rating: countedExams[0]?.rating ?? -1,
            description: `The most recent ${displayExamType(examType)} rating`,
        },
        {
            name: 'Test 2',
            rating: countedExams[1]?.rating ?? -1,
            description: `The second-most recent ${displayExamType(examType)} rating`,
        },
        {
            name: 'Test 3',
            rating: countedExams[2]?.rating ?? -1,
            description: `The third-most recent ${displayExamType(examType)} rating`,
        },
    ];
}

/**
 * Returns a UI display string for the given exam type.
 * @param examType The exam type to display.
 */
function displayExamType(examType: ExamType): string {
    switch (examType) {
        case ExamType.Tactics:
            return 'Tactics Test';
        case ExamType.Polgar:
            return 'Polgar Mate Test';
    }
}
