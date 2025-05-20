import { Datum } from '../ClockUsage';


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

function getPerfectArea(dataset: Datum[]): number {
    const size = Math.min(50, dataset.length) - 1;
    const {slope: perfectSlope, intercept: perfectIntercept} = normalLine(dataset, 5, size);
    const perfectArea = calculateAreaUnderLine(perfectSlope, perfectIntercept, 5, size);
    return perfectArea;
}

function getZeroRatingArea(dataset: Datum[], timeControl: number, increment: number): number {
    const size = Math.min(50, dataset.length) - 1;
    const perfectArea = getPerfectArea(dataset);
    const noobArea = (timeControl + increment) * size;

    return Math.abs(perfectArea - noobArea);
}

function getRatingFormula(dataset: Datum[], timeControl: number, increment: number, comparisonArea: number): number {
    const zeroRatingArea = getZeroRatingArea(dataset, timeControl, increment);
    const slope = (-3000 / zeroRatingArea);
    console.log('Zero Rating Area', zeroRatingArea)
    console.log('Forumula', `y = ${slope}x + ${3000}`);
    const rating = ((-3000 * (comparisonArea)) / zeroRatingArea) + 3000;

    if(rating <= 0){
        return 0;
    }

    return Math.round(rating);
}

export function calculateTimeRating(dataset: Datum[], timeControl: number | undefined, increment: number | undefined, side: string){
    if(!timeControl){
        return 0;
    }
    let inc = 0;
    if(increment){
        inc = increment;
    }
    const size = Math.min(50, dataset.length);
    const sideArea = Math.abs(calculateAreaUnderCurve(dataset, 5, size-1) - getPerfectArea(dataset));
    const sideRating = getRatingFormula(dataset, timeControl, inc, sideArea);
    console.log(`Side: ${side} Rating Analysis`)
    console.log(`Side: ${side} Area: ${sideArea}`)
    console.log(`Side: ${side} Rating: ${sideRating}`)
    return sideRating;
}