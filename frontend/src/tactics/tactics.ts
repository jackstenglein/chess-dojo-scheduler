import { Chess, COLOR, Move } from '@jackstenglein/chess';
import { Requirement } from '../database/requirement';
import {
    ALL_COHORTS,
    compareCohorts,
    isCohortGreater,
    isCohortInRange,
    isCohortLess,
    User,
} from '../database/user';

export const sampleProblems = [
    `[FEN "r5k1/pp2bppp/2p1pn2/3rN2q/5QP1/2BP4/PP2PP1P/R4RK1 b - - 0 1"]
[SetUp "1"]

1... Nxg4! { [1] } 2. Nxg4 (2. Qxg4 Rxe5 { [1] }) 2... Bd6! 3. Qf3 Rg5 { [1] } 4. h3 f5 $19 { black is winning } *`,

    `[FEN "6k1/p4ppp/P1n5/8/8/8/r3rPPP/1R1R2K1 w - - 0 1"]
[SetUp "1"]

1. Rb8+! Nxb8 (1... Re8 { [0][EOL] doesn't help } 2. Rxe8#) (1... Nd8 { [0][EOL] doesn't help } 2. Rbxd8+) 2. Rd8+ { [EOL] } 2... Re8 3. Rxe8# *`,

    `[FEN "1r2r2k/1q1bNppp/2n5/p7/1p6/4R3/P1Q2PPP/1R3NK1 w - - 0 1"]
[SetUp "1"]

1. Nf5! { [3] Any move saving the knight on e7 that is under attack would be appropriate here. This is the best of them by a small margin because it's the best square for the knight, and it does not let the black queen into the game via trade or Nd4.
NOTE: this is your final warning that not every position in the tactics test has a tactical solution! You can not just input whatever move looks violent like in some tactics trainers, as you will often come up against positions like this one, where you simply need to retreat a piece or develop a piece, and the “tactical moves” are mistakes. } (1. Nd5 { [ALT] } 1... Nd4 { This is a nice move for black, bringing the queen further into the action. }) (1. Nxc6 { [ALT] } 1... Qxc6 { Again this improves black’s queen. Also, the endgames are very tough to hold because of Be6 and the strength of that queenside majority. }) (1. Rbe1!? { [ALT] My second favorite option, bringing the b1 rook into the game. }) (1. Qxh7+? { This mating combination does not work here: } 1... Kxh7 2. Rh3+ Bxh3) (1. Qc5 { [ALT] This move also saves the N, albeit in a scary-looking way. }) *`,

    `[FEN "r1bq1rk1/pp2bppp/2n1p3/3pP3/3p2QP/2NB1N2/PPP2PP1/R3K2R w KQ - 0 1"]
[SetUp "1"]

1. Bxh7+ Kxh7 { [0] } (1... Kh8 { [0] } 2. Qh5) 2. Qh5+ (2. Ng5+? Kh6! { And it's not clear how white should continue the attack. Often in such positions there is a Bishop on c1, and then Knight can go to e6 followed by Qg7 checkmate. That pattern is not available here though! }) 2... Kg8 { [0] } 3. Ng5 Bxg5 (3... Re8 4. Qh7+ { [0] } 4... Kf8 { [0] } 5. Qh8#) 4. hxg5 { [0] } 4... f5 (4... Re8 { [0] } 5. Qh8#) (4... f6 5. g6 { [EOL] } 5... Re8 6. Qh8#) 5. g6 { [2] [EOL] The g-pawn is the nail in the coffin: black is mated. The final thrashings could be: } (5. Qh7+? { White does have a continuing attack, but this move essentially drives the black king to relative safety, rather than shutting him in and mating him. } 5... Kf7 6. g6+ Ke8 7. Qxg7 { And the game goes on. }) (5. Qh8+? { White does have a continuing attack, but this move essentially drives the black king to relative safety, rather than shutting him in and mating him. } 5... Kf7 6. g6+ Ke8 7. Qxg7 { And the games goes on. }) 5... Qh4 6. Qxh4 Rd8 7. Qh8# *`,
];

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

const scoreRegex = /^\[(\d+)\]/;
const alternateSolutionRegex = /^\[ALT\]/;
const endOfLineRegex = /^\[EOL\]/;

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
 * Recursively calculates the total score for the given solution to the tactics test.
 * Each move in the solution counts as one point toward the total score. Each move
 * also has its userData.score field set.
 * @param solution The Move history for the solution to a tactics problem.
 * @returns The total score for the given solution.
 */
export function getSolutionScore(
    playAs: 'white' | 'black',
    solution: Move[],
    chess: Chess,
    isUnscored: boolean,
): number {
    let score = 0;

    for (let move of solution) {
        // Recursively check variations
        if (move.variations.length > 0) {
            for (let variation of move.variations) {
                score += getSolutionScore(playAs, variation, chess, isUnscored);
            }
        }

        if (move.color === playAs[0] && !chess.isMainline(move.san, move.previous)) {
            // If this is the color the test has us playing as and this isn't the mainline,
            // we give them no points for this variation
            isUnscored = true;
        }

        if (!isUnscored) {
            const scoreSearch = scoreRegex.exec(move.commentAfter || '');
            if (scoreSearch && scoreSearch.length > 1) {
                move.userData = {
                    score: parseInt(scoreSearch[1]),
                };
                move.commentAfter = move.commentAfter
                    ?.replace(scoreSearch[0], '')
                    .trimStart();
            } else {
                move.userData = { score: 1 };
            }
        } else {
            const altSearch = alternateSolutionRegex.exec(move.commentAfter || '');
            if (altSearch) {
                move.userData = {
                    ...move.userData,
                    isAlt: true,
                };
                move.commentAfter = move.commentAfter
                    ?.replace(altSearch[0], '')
                    .trimStart();
            }
        }

        score += move.userData?.score || 0;

        const eolSearch = endOfLineRegex.exec(move.commentAfter || '');
        if (eolSearch) {
            // We give no more points after an EOL marker, so can break here.
            move.commentAfter = move.commentAfter?.replace(eolSearch[0], '').trimStart();
            break;
        }
    }

    return score;
}

/**
 * Recursively calculates the user's score for a given variation in a tactics test.
 * @param solution The variation in the solution to the problem.
 * @param currentAnswerMove The current move to start from in the user's answer.
 * @param answer The user's answer Chess instance.
 * @returns The user's score for the given variation.
 */
export function scoreVariation(
    playAs: 'white' | 'black',
    solution: Move[],
    currentAnswerMove: Move | null,
    answer: Chess,
    variationAlt: boolean,
): [number, boolean] {
    let score = 0;
    let altFound = false;

    for (let move of solution) {
        // The user may not have found the mainline solution,
        // but may have found a variation, which can also have a score associated, or can be an alternate solution
        // for this move
        if (move.variations.length > 0) {
            for (let variation of move.variations) {
                const [variationScore, alt] = scoreVariation(
                    playAs,
                    variation,
                    currentAnswerMove,
                    answer,
                    variationAlt,
                );
                score += variationScore;
                if (alt) {
                    variationAlt = true;
                }
            }
        }

        if (
            !variationAlt &&
            move.color === playAs[0] &&
            !answer.isMainline(move.san, currentAnswerMove)
        ) {
            // If this is the color the test has us playing as and the user didn't have this
            // move as their mainline and didn't find an alternate solution, we give them no
            // points for the variation, so we can break from the loop
            break;
        }

        const answerMove = answer.move(move.san, currentAnswerMove, false, true, true);
        if (!answerMove && !variationAlt) {
            // The user didn't find this move at all (mainline or variation), so they couldn't
            // have found any subsequent moves and we can break
            break;
        }

        move.userData = {
            ...move.userData,
            found: Boolean(answerMove),
            altFound: variationAlt,
        };
        score += move.userData.score || 0;
        currentAnswerMove = answerMove;

        if (move.userData.isAlt) {
            altFound = true;
        }
    }

    return [score, altFound];
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
            )!;
            existingMove.userData = {
                extra: true,
            };
        }
        currentSolutionMove = existingMove;
    }
}

const PolgarM1ReqId = '917be358-e6d9-47e6-9cad-66fc2fdb5da6';
const PolgarM2ReqId = 'f815084f-b9bc-408d-9db9-ba9b1c260ff3';
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
        rating.components.push(getPolgarRating(user, requirements));
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
        rating.components.push(...getExamRating(user));
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
 * Returns whether the user is assigned the given task, based on their cohort.
 * @param user The user to check.
 * @param req The task to check.
 * @returns True if the user is assigned the given task.
 */
function hasTask(user: User, req: Requirement): boolean {
    return Object.keys(req.counts).includes(user.dojoCohort);
}

/**
 * Calculates the user's Polgar Mate rating.
 * @param user The user to calculate the Polgar Mate rating for.
 * @param polgarM1 The Polgar Mate in One requirement.
 * @param polgarM2 The Polgar Mate in Two requirement.
 * @returns The user's Polgar Mate rating.
 */
function getPolgarRating(
    user: User,
    requirements: Requirement[],
): TacticsRatingComponent {
    const polgarM1 = requirements.find((r) => r.id === PolgarM1ReqId);
    const polgarM2 = requirements.find((r) => r.id === PolgarM2ReqId);
    if (!polgarM1 || !polgarM2) {
        return {
            name: 'Polgar Mates',
            rating: -1,
            description: 'Based on progress on the Polgar Mates in 1 and 2 tasks',
        };
    }

    const hasM1 = hasTask(user, polgarM1);
    const m1Rating = hasM1 ? getTaskRating(user, polgarM1) : -1;

    if (hasM1 && m1Rating < getTaskMaxRating(polgarM1)) {
        return {
            name: 'Polgar Mates',
            rating: m1Rating,
            description: 'Based on progress on the Polgar Mates in 1 task',
        };
    }

    const m2Rating = getTaskRating(user, polgarM2);
    return {
        name: 'Polgar Mates',
        rating: Math.max(m1Rating, m2Rating),
        description: hasM1
            ? 'Based on progress on the Polgar Mates in 1 and 2 tasks'
            : 'Based on progress on the Polgar Mates in 2 task',
    };
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
 * @returns The exam rating component.
 */
function getExamRating(user: User): TacticsRatingComponent[] {
    const numberOfExams = 3;
    const countedExams = Object.values(user.exams || {})
        .filter((e) => isCohortInRange(user.dojoCohort, e.cohortRange))
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
                name: 'Tests',
                rating,
                description: 'The average of the 3 most recent Dojo Tactics Test ratings',
            },
        ];
    }

    return [
        {
            name: 'Test 1',
            rating: countedExams[0]?.rating ?? -1,
            description: 'The most recent Dojo Tactics Test rating',
        },
        {
            name: 'Test 2',
            rating: countedExams[1]?.rating ?? -1,
            description: 'The second-most recent Dojo Tactics Test rating',
        },
        {
            name: 'Test 3',
            rating: countedExams[2]?.rating ?? -1,
            description: 'The third-most recent Dojo Tactics Test rating',
        },
    ];
}
