import { Chess, Move } from '@jackstenglein/chess';

const scoreRegex = /^\[(\d+)\]/;

export function getMoveDescription(found?: boolean, score?: number): string {
    if (found) {
        if (score) {
            return `Great job finding this move! You earned ${score} point${score !== 1 ? 's' : ''}.`;
        }
        return `You found this move, but it's worth 0 points.`;
    }

    if (score) {
        return `You didn't find this move and lost ${score} point${score !== 1 ? 's' : ''}.`;
    }
    return `You didn't find this move, but it's worth 0 points.`;
}

export function getSolutionScore(solution: Move[]): number {
    let score = 0;

    for (let move of solution) {
        // Recursively check variations
        if (move.variations.length > 0) {
            for (let variation of move.variations) {
                score += getSolutionScore(variation);
            }
        }

        const scoreSearch = scoreRegex.exec(move.commentAfter || '');
        if (scoreSearch && scoreSearch.length > 1) {
            move.userData = {
                score: parseInt(scoreSearch[1]),
            };
            move.commentAfter = move.commentAfter?.replace(scoreSearch[0], '');
        } else {
            move.userData = { score: 0 };
        }

        score += move.userData.score;
    }

    return score;
}

export function scoreVariation(
    solution: Move[],
    currentAnswerMove: Move | null,
    answer: Chess,
): number {
    let score = 0;

    for (let move of solution) {
        // The user may not have found the mainline solution,
        // but may have found a variation, which can also have a score associated
        if (move.variations.length > 0) {
            for (let variation of move.variations) {
                score += scoreVariation(variation, currentAnswerMove, answer);
            }
        }

        // Check if the user found this move and save it in the userData if so.
        // If the user didn't find the move, then they couldn't have found the
        // continuations, so we can break from the loop
        const answerMove = answer.move(move.san, currentAnswerMove, false, true, true);
        if (!answerMove) {
            break;
        }

        move.userData = {
            ...move.userData,
            found: true,
        };
        score += move.userData.score || 0;
        currentAnswerMove = answerMove;
    }

    return score;
}

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
