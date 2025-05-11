import { Datum } from '../ClockUsage';


function perfectLine(timeControl: number, increment: number, gameMoveLength: number): {slope: number, intercept: number}{

  const slope = - (timeControl + increment) / gameMoveLength;
  const intercept = timeControl - 459;

  return {slope: slope, intercept: intercept}
}

function normalLine(
  dataset: Datum[],
  startMoveIndex: number = 0,
  endMoveIndex: number,
): { slope: number; intercept: number } {
 
  console.log('Normal line reverse', dataset)
  const { seconds: y2, moveNumber: x2 } = dataset[endMoveIndex];
  const { seconds: y1, moveNumber: x1 } = dataset[startMoveIndex];

  const slope = (y2 - y1) / (x2 - x1);
  return { slope, intercept: y1 };
}

function fitLine(
  dataset: Datum[],
  startMoveIndex: number = 0,
  endMoveIndex: number,
): { slope: number; intercept: number } {

  console.log('Fit line reverse', dataset)
  if (startMoveIndex >= endMoveIndex || endMoveIndex - startMoveIndex < 2) {
    console.warn('[TimeRating] Not enough data points to fit line, returning default values');
    return { slope: -2.0, intercept: 100 };
  }

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, count = 0;

  for (let i = startMoveIndex; i < endMoveIndex && i < dataset.length; i++) {
    const { moveNumber: x, seconds: y } = dataset[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
    count++;
  }

  const denominator = count * sumXX - sumX * sumX;
  if (count < 2 || denominator === 0) {
    console.warn('[TimeRating] Cannot calculate slope (division by zero), returning default values');
    return { slope: -2.0, intercept: 100 };
  }

  const slope = (count * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / count;

  return { slope, intercept };
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

  console.log(endMoveIndex)
  console.log(dataset.length)
  endMoveIndex = Math.min(endMoveIndex, dataset.length - 1);

  const inc = increment || 0;

  let { slope: predictedSlope, intercept: predictedIntercept } = fitLine(dataset, startMoveIndex, endMoveIndex);
  let { slope: standardSlope, intercept: standardIntercept } = normalLine(dataset, startMoveIndex, endMoveIndex);
  const { slope: perfectSlope, intercept: perfectIntercept } = perfectLine(timeControl, inc, endMoveIndex);

  if(predictedSlope < 0 && standardSlope > 0 || predictedSlope > 0 && standardSlope < 0){
    standardSlope = - standardSlope;
  }

  const avgSlope = (predictedSlope + standardSlope) / 2;
  const avgIntercept = (predictedIntercept + standardIntercept) / 2

  // Deviation calculations
  const slopeEpsilon = 0.01;
  const interceptEpsilon = 0.01;

  const slopeDeviation = Math.min(
    1,
    Math.abs(avgSlope - perfectSlope) / Math.max(slopeEpsilon, Math.abs(perfectSlope))
  );

  const interceptDeviation = Math.min(
    1,
    Math.abs(avgIntercept - perfectIntercept) / Math.max(interceptEpsilon, Math.abs(perfectIntercept))
  );

  const SLOPE_WEIGHT = 0.8;
  const INTERCEPT_WEIGHT = 0.2;

  const totalDeviation = slopeDeviation * SLOPE_WEIGHT + interceptDeviation * INTERCEPT_WEIGHT;

  const rating = Math.max(0, Math.round(MAX_RATING * (1 - totalDeviation)));

  console.log(`[TimeRating] ${side} side analysis: for ${phase}`);
  console.log(`Perfect slope: ${perfectSlope.toFixed(2)}, Perfect intercept: ${perfectIntercept.toFixed(2)}`);
  console.log(`Predicted slope: ${predictedSlope.toFixed(2)}, Standard slope: ${standardSlope.toFixed(2)}`);
  console.log(`Avg slope: ${avgSlope.toFixed(2)}, Predicted intercept: ${predictedIntercept.toFixed(2)}`);
  console.log(`Slope deviation: ${slopeDeviation.toFixed(3)}, Intercept deviation: ${interceptDeviation.toFixed(3)}`);
  console.log(`Total deviation: ${totalDeviation.toFixed(3)}, Final rating: ${rating}`);

  return Math.round(rating);
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
  const openingStartMoveIndex = dataset.length >= 20 ? 9 : Math.floor(dataset.length * 0.3);
  const preBonusRating = calculateDatasetRating(dataset, timeControl, increment, openingStartMoveIndex, endMoveIndex, side, "PREBONUS");
  if(endMoveIndex !== dataset.length){
    const postBonusRating = calculateDatasetRating(dataset, bonusTimeControl, bonusIncrement, endMoveIndex, dataset.length - 1, side, "POSTBONUS");

    const finalRating = (preBonusRating + postBonusRating) / 2;

    return Math.round(finalRating);
  }else {
    return Math.round(preBonusRating);
  }
}
