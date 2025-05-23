import { Datum } from '../ClockUsage';

export const MIN_MOVE = 5;
export const MAX_MOVE = 50;
const PERFECT_TIME_AT_MAX_MOVE = 120; // Expected to have 2 minutes at move 50
const MAX_RATING = 3000; // The rating given if the player has zero area
export const MIN_TIME_CONTROL = 30 * 60; // 30 minutes

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
 * Returns the number of seconds the perfect line would have on the clock for the given
 * time control and move.
 * @param timeControl The initial time on the clock at the start of the game.
 * @param move The move to calculate the number of seconds for.
 * @returns The number of seconds the perfect line would have on the clock at the given move.
 */
export function getPerfectLineSecondsParabola(timeControl: number, move: number): number {
    if (move < MIN_MOVE) {
        throw new Error(
            `Provided move ${move} must be greater than or equal to min move ${MIN_MOVE}`,
        );
    }
    if (move > MAX_MOVE) {
        throw new Error(`Provided move ${move} must be less than or equal to max move ${MAX_MOVE}`);
    }

    const coefficient = (timeControl - PERFECT_TIME_AT_MAX_MOVE) / (MAX_MOVE - MIN_MOVE) ** 2;
    return coefficient * (move - MAX_MOVE) ** 2 + PERFECT_TIME_AT_MAX_MOVE;
}

/**
 * Calculates the approximate area between the player's clock graph and the perfect
 * clock graph. This function approximates the value ∫[a, b] |f(x) - g(x)| dx. The
 * approximation is calculated using the trapezoidal method, where each trapezoid has
 * a height of 1.
 * @param dataset The player's clock at each move.
 * @param timeControl The initial time control.
 * @returns The player's area and the zero rating area.
 */
function calculateAreas(
    dataset: Datum[],
    timeControl: number,
): { playerArea: number; absolutePlayerArea: number; zeroRatingArea: number } {
    let playerArea = 0;
    let absolutePlayerArea = 0;
    let zeroRatingArea = 0;

    for (let i = MIN_MOVE; i < Math.min(dataset.length, MAX_MOVE) - 1; i++) {
        const player1 = dataset[i].seconds;
        const player2 = dataset[i + 1].seconds;

        const perfect1 = getPerfectLineSecondsParabola(timeControl, i);
        const perfect2 = getPerfectLineSecondsParabola(timeControl, i + 1);

        const pointArea = (Math.abs(player1 - perfect1) + Math.abs(player2 - perfect2)) / 2;
        console.debug(
            `player(${i}) = ${player1}; perfect(${i}) = ${perfect1}; player(${i + 1}) = ${player2}; perfect(${i + 1}) = ${perfect2}; area = ${pointArea}`,
        );
        console.debug(
            `player(${i}) - perfect(${i}) = ${Math.abs(player1 - perfect1)}; player(${i + 1}) - perfect(${i + 1}) = ${Math.abs(player2 - perfect2)}; area = ${pointArea} `,
        );

        if (player1 > perfect1 || player2 > perfect2) {
            playerArea += pointArea;
        } else {
            playerArea -= pointArea;
        }

        absolutePlayerArea += pointArea;
        zeroRatingArea += (timeControl - perfect1 + (timeControl - perfect2)) / 2;
    }

    return { playerArea, absolutePlayerArea, zeroRatingArea };
}

/**
 * Calculates the time management rating for the given dataset.
 * @param dataset The player's clock at each move.
 * @param side The side whose rating is being calculated. Used only for debug logs.
 * @returns The time management rating for the given dataset, or -1 if it cannot be calculated.
 */
export function calculateTimeRating(
    dataset: Datum[],
    side: string,
): { rating: number; area: number } | undefined {
    if (dataset.length < MIN_MOVE) {
        return;
    }
    const timeControl = dataset[0].seconds;
    if (timeControl <= MIN_TIME_CONTROL) {
        return;
    }

    console.log(`${side} Rating Analysis`);
    console.log(`${side} Dataset: `, dataset);
    console.log(`${side} Time Control: `, timeControl);
    console.log(`${side} Number of moves: ${dataset.length}`);

    // The player's rating is calculated as a point on the line between (0, MAX_RATING) and (zeroRatingArea, 0).
    const { playerArea, absolutePlayerArea, zeroRatingArea } = calculateAreas(dataset, timeControl);
    const playerRating = ((-1 * MAX_RATING) / zeroRatingArea) * absolutePlayerArea + MAX_RATING;

    console.log(`${side} Zero Rating Area: ${zeroRatingArea}`);
    console.log(`${side} Area: ${playerArea}`);
    console.log(`${side} Absolute Area: ${absolutePlayerArea}`);
    console.log(`${side} Forumula: y = ${(-1 * MAX_RATING) / zeroRatingArea}x + ${MAX_RATING}`);
    console.log(`${side} Rating: ${playerRating}`);

    return { rating: Math.round(Math.max(0, playerRating)), area: playerArea };
}
