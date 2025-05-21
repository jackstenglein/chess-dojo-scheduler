import { Datum } from '../ClockUsage';

export const MIN_MOVE = 5;
export const MAX_MOVE = 50;
const PERFECT_TIME_AT_MAX_MOVE = 120; // Expected to have 2 minutes at move 50
const MAX_RATING = 3000; // The rating given if the player has zero area

/**
 * Returns the number of seconds the perfect line would have on the clock for the given
 * time control and move.
 * @param timeControl The initial time on the clock at the start of the game.
 * @param move The move to calculate the number of seconds for.
 * @returns The number of seconds the perfect line would have on the clock at the given move.
 */
export function getPerfectLineSeconds(timeControl: number, move: number): number {
    if (move < MIN_MOVE) {
        throw new Error(
            `Provided move ${move} must be greater than or equal to min move ${MIN_MOVE}`,
        );
    }
    if (move > MAX_MOVE) {
        throw new Error(`Provided move ${move} must be less than or equal to max move ${MAX_MOVE}`);
    }
    return (
        ((PERFECT_TIME_AT_MAX_MOVE - timeControl) / (MAX_MOVE - MIN_MOVE)) * (move - MIN_MOVE) +
        timeControl
    );
}

/**
 * Calculates the approximate area between the player's clock graph and the perfect
 * clock graph. This function approximates the value ∫[a, b] |f(x) - g(x)| dx. The
 * approximation is calculated using the trapezoidal method, where each trapezoid has
 * a height of 1.
 * @param dataset The player's clock at each move.
 * @param timeControl The initial time control.
 * @returns The area between the player's clock graph and the perfect clock graph.
 */
function calculatePlayerArea(dataset: Datum[], timeControl: number): number {
    let area = 0;

    for (let i = MIN_MOVE + 1; i < Math.min(dataset.length, MAX_MOVE) - 1; i++) {
        const f1 = dataset[i].seconds;
        const f2 = dataset[i + 1].seconds;

        const g1 = getPerfectLineSeconds(timeControl, i);
        const g2 = getPerfectLineSeconds(timeControl, i + 1);

        const pointArea = (Math.abs(f1 - g1) + Math.abs(f2 - g2)) / 2;
        console.debug(
            `player(${i}) = ${f1}; perfect(${i}) = ${g1}; player(${i + 1}) = ${f2}; perfect(${i + 1}) = ${g2}; area = ${pointArea}`,
        );

        area += pointArea;
    }

    return area;
}

/**
 * Calculates the time management rating for the given dataset.
 * @param dataset The player's clock at each move.
 * @param side The side whose rating is being calculated. Used only for debug logs.
 * @returns The time management rating for the given dataset, or -1 if it cannot be calculated.
 */
export function calculateTimeRating(dataset: Datum[], side: string) {
    if (dataset.length < MIN_MOVE) {
        return -1;
    }
    const timeControl = dataset[0].seconds;
    if (timeControl <= 0) {
        return -1;
    }

    // zeroRatingArea is the area of the triangle created by the perfect line and the initial time control
    // If the user has this area or more, they are given a rating of 0.
    const zeroRatingArea = 0.5 * (Math.min(dataset.length, MAX_MOVE) - MIN_MOVE) * timeControl;

    console.log(`${side} Rating Analysis`);
    console.log(`${side} Dataset: `, dataset);
    console.log(`${side} Time Control: `, timeControl);
    console.log(`${side} Number of moves: ${dataset.length}`);
    console.log(`${side} Zero Rating Area: ${zeroRatingArea}`);
    console.log(`${side} Forumula: y = ${(-1 * MAX_RATING) / zeroRatingArea}x + ${MAX_RATING}`);

    // The player's rating is calculated as a point on the line between (0, MAX_RATING) and (zeroRatingArea, 0).
    const playerArea = calculatePlayerArea(dataset, timeControl);
    const playerRating = ((-1 * MAX_RATING) / zeroRatingArea) * playerArea + MAX_RATING;

    console.log(`${side} Area: ${playerArea}`);
    console.log(`${side} Rating: ${playerRating}`);

    return Math.round(Math.max(0, playerRating));
}
