import { COLOR, Chess, Move } from '@jackstenglein/chess';

const scoreRegex = /\[(\d+)\]/;
const alternateSolutionRegex = /\[ALT\]/;
const endOfLineRegex = /\[EOL\]/;

/**
 * Gets the exam orientation for the provided Chess instance. The exam
 * orientation is determined by the side to move at the start position.
 * @param chess The Chess instance to get the orientation for.
 * @returns The orientation of the Chess instance.
 */
export function getOrientation(chess: Chess): 'white' | 'black' {
    const fen = chess.fen(null);
    const tokens = fen.split(' ');
    const color = tokens[1];
    if (color === 'b') {
        return 'black';
    }
    return 'white';
}

/**
 * Initializes the given Chess object as a solution to an exam. IE:
 * the moves are traversed and their necessary userData fields are set.
 * @param chess The Chess instance to initialize.
 */
export function initializeSolution(chess: Chess) {
    chess.seek(null);
    getSolutionScore(
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

    for (const move of solution) {
        // Recursively check variations
        if (move.variations.length > 0) {
            for (const variation of move.variations) {
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

        // Remove disabled when there's time to.
        /* eslint-disable @typescript-eslint/restrict-plus-operands */
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

    for (const move of solution) {
        // The user may not have found the mainline solution,
        // but may have found a variation, which can also have a score associated, or can be an alternate solution
        // for this move
        if (move.variations.length > 0) {
            for (const variation of move.variations) {
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

        // Remove disabled when there's time to.
        /* eslint-disable @typescript-eslint/restrict-plus-operands */
        score += move.userData.score || 0;
        currentAnswerMove = answerMove;

        if (move.userData.isAlt) {
            altFound = true;
        }
    }

    return [score, altFound];
}
