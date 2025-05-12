import { Datum } from '../ClockUsage';

function perfectLine(
    timeControl: number,
    increment: number,
    gameMoveLength: number,
): { slope: number; intercept: number } {
    const slope = -(timeControl + increment) / gameMoveLength;
    const intercept = timeControl - 459;

    return { slope: slope, intercept: intercept };
}

function normalLine(dataset: Datum[], start: number, end: number): {slope: number, intercept: number} {
    const intercept = dataset[start].seconds;
    const y1 = intercept;
    const y2 = dataset[end].seconds;
    const x1 = dataset[start].moveNumber;
    const x2 = dataset[end].moveNumber

    const slope = (y2 - y1) / (x2 - x1);
    return {slope: slope, intercept: intercept};
}

function calculateAreaUnderCurve(dataset: Datum[], start: number, end: number): number {
    let area = 0;
    for (let i = start; i < end; i++) {
        const x1 = dataset[i].moveNumber;
        const x2 = dataset[i + 1].moveNumber;
        const y1 = dataset[i].seconds;
        const y2 = dataset[i + 1].seconds;

        const base = x2 - x1;
        const height = (y1 + y2) / 2;

        area += base * height;
    }
    return area;
}

function calculateAreaUnderLine(
    slope: number,
    intercept: number,
    xStart: number,
    xEnd: number,
): number {
    // ∫(mx + b) dx from xStart to xEnd = [0.5 * m * x^2 + b * x] from xStart to xEnd
    const areaAtStart = 0.5 * slope * xStart ** 2 + intercept * xStart;
    const areaAtEnd = 0.5 * slope * xEnd ** 2 + intercept * xEnd;
    return areaAtEnd - areaAtStart;
}

function calculateDatasetRating(
    dataset: Datum[],
    timeControl: number | undefined,
    increment: number | undefined,
    startMoveIndex: number,
    endMoveIndex: number,
    side: string,
    phase: string,
): number {
    const MAX_RATING = 3000;

    if (!timeControl) {
        console.warn('[TimeRating] Invalid time control');
        return 0;
    }

    endMoveIndex = Math.min(endMoveIndex, dataset.length - 1);
    const inc = increment || 0;

    const { slope: perfectSlope, intercept: perfectIntercept } = normalLine(dataset, startMoveIndex, endMoveIndex);

    const actualArea = calculateAreaUnderCurve(dataset, startMoveIndex, endMoveIndex);
    const perfectArea = calculateAreaUnderLine(
        perfectSlope,
        perfectIntercept,
        dataset[startMoveIndex].moveNumber,
        dataset[endMoveIndex].moveNumber,
    );

    const areaDeviation = Math.min(
        1,
        Math.abs(actualArea - perfectArea) / Math.max(1, Math.abs(perfectArea)),
    );

    const rating = Math.max(0, Math.round(MAX_RATING * (1 - areaDeviation)));

    console.log(`[TimeRating] ${side} side analysis: for ${phase}`);
    console.log(`Actual Area: ${actualArea.toFixed(2)}, Perfect Area: ${perfectArea.toFixed(2)}`);
    console.log(`Area deviation: ${areaDeviation.toFixed(3)}, Final rating: ${rating}`);

    return rating;
}


export function calculateTimeRating(
    dataset: Datum[],
    timeControl: number | undefined,
    increment: number | undefined,
    bonusTimeControl: number | undefined,
    bonusIncrement: number | undefined,
    side: string,
    endMoveIndex: number,
): number {

    if (dataset.length <= 20) {
        return 0;
    }

    const openingStartMoveIndex = 5;
    const totalMoveCount = dataset.length - openingStartMoveIndex;

    const preBonusMoveCount = Math.max(0, endMoveIndex - openingStartMoveIndex);
    const postBonusMoveCount = Math.max(0, dataset.length - endMoveIndex);

    const preBonusRating = calculateDatasetRating(
        dataset,
        timeControl,
        increment,
        openingStartMoveIndex,
        endMoveIndex,
        side,
        'PREBONUS',
    );

    if (postBonusMoveCount > 0 && bonusTimeControl !== undefined) {
        const postBonusRating = calculateDatasetRating(
            dataset,
            bonusTimeControl,
            bonusIncrement,
            endMoveIndex,
            dataset.length - 1,
            side,
            'POSTBONUS',
        );

        const preWeight = preBonusMoveCount / totalMoveCount;
        const postWeight = postBonusMoveCount / totalMoveCount;

        const finalRating = preBonusRating * preWeight + postBonusRating * postWeight;

        return Math.round(finalRating);
    } else {
        return Math.round(preBonusRating);
    }
}

