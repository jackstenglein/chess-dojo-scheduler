

import { Datum } from "../ClockUsage";

// const AVG_BEST_90_30_INTEGRAL = 6350;
// const MAX_RATING = 3000;

// /**
//  * Approximates the definite integral of a function using the Trapezoidal Rule.
//  *
//  * @param func - The function to integrate,
//  * @param lowerLimit - The start of the interval (a)
//  * @param upperLimit - The end of the interval (b)
//  * @param numberOfSubIntervals - The number of trapezoids (n). Higher means more accuracy.
//  * @returns The approximate value of the integral from a to b.
//  */
// function trapezoidalRule(
//     func: (x: number, dataset: Datum[]) => number,
//     lowerLimit: number,
//     upperLimit: number,
//     numberOfSubIntervals: number,
//     dataset: Datum[]
//   ): number {
//     const intervalWidth = (upperLimit - lowerLimit) / numberOfSubIntervals;
//     let totalArea = func(lowerLimit, dataset) + func(upperLimit, dataset);
  
//     for (let i = 1; i < numberOfSubIntervals; i++) {
//       const x = lowerLimit + i * intervalWidth;
//       totalArea += 2 * func(x, dataset);
//     }
  
//     return (intervalWidth / 2) * totalArea;
//   }


//   function funcMoveToSeconds(xMove: number, dataSet: Datum[]): number{

//     const dataVals = dataSet.values();
//     let secs = 0;

//     dataVals.forEach((data) => {
//       if(data.moveNumber === xMove){
//         secs = data.seconds;
//       }
//     })

//     return secs;
//   }


//   export function calculateIntegral(dataSet: Datum[]): number {
//     return trapezoidalRule(funcMoveToSeconds, 0, dataSet.length, dataSet.length, dataSet) ;
//   }

//   export function calculateTimeRating(dataset: Datum[]): number {
//     const currentIntegral = calculateIntegral(dataset);

//     if(currentIntegral > AVG_BEST_90_30_INTEGRAL){
//        return Math.round((AVG_BEST_90_30_INTEGRAL / currentIntegral) * MAX_RATING);
//     }else if(AVG_BEST_90_30_INTEGRAL > currentIntegral){
//       return Math.round((currentIntegral/ AVG_BEST_90_30_INTEGRAL) * MAX_RATING);
//     }else{
//       return MAX_RATING;
//     }
//   }
  
  // export function calculateTimeRating(dataset: Datum[], timeControl: number | undefined, increment: number | undefined): number {
  //   if(!timeControl){
  //     return 0;
  //   }

  //   let inc = 0;
  //   if(increment){
  //     inc = increment;
  //   }
  //   console.log('Dataset', dataset);
  //   const maxRating = 3000;
  //   const startTime = Math.round((timeControl + (inc * dataset.length) / dataset.length));
  //   const avgTime = Math.round(startTime / dataset.length);
  //   let lessTimeCount = 0;
  //   let maxTimeCount = 0;
  //   const reversedSet = dataset.reverse();
  //   for(let i = 1; i < reversedSet.length; i++){
  //     const currentTime = reversedSet[i].seconds;
  //     console.log('Current Time ',currentTime)

  //     if(currentTime > avgTime){
  //       maxTimeCount++;
  //     }else if(currentTime < avgTime){
  //       lessTimeCount++;
  //     }
  //   }

  //   console.log('MAX COUNT', maxTimeCount);
  //   console.log('MIN COUNT', lessTimeCount)


  //   const maxPercent = maxTimeCount / dataset.length;
  //   console.log('MAX PERCENT', maxPercent);
  //   const lesspercent = lessTimeCount / dataset.length;
  //   console.log('MIN PERCENT', lesspercent);

  //   if(lesspercent >= 0.78 || maxPercent <= 0.40){
  //     return maxRating * (1 - lesspercent);
  //   }else if(maxPercent >= 0.78 || lesspercent <= 0.40){
  //     return maxRating * (1 - maxPercent);
  //   }
  //   const overallPercent = Math.max(maxPercent, lesspercent);

  //   const currentRating = maxRating * (overallPercent);

  //   console.log('START SECONDS', startTime);
  //   console.log(`AVG SECONDS`, avgTime);
  //   console.log('Overall Percent', overallPercent)
    

  //   return currentRating;
  // }


  const BEST_MAP_SLOPE: Record<number, number> = {
    5430: -5.20,
    5400: -5.10,
    3630: -4.74,
    3600: -4.64,
    2730: -3.80,
    2700: -3.70,
    1830: -2.00,
    1800: -1.80
  }
  
  const BEST_MAP_INTERCEPT: Record<number, number> = {
    5430: 384,
    5400: 384,
    3630: 248,
    3600: 248,
    2730: 138,
    2700: 138,
    1830: 107,
    1800: 88
  }
  
  const BEST_REF_MOVE_SIZE: Record<number, number> = {
    5430: 60,
    5400: 60,
    3630: 60,
    3600: 60,
    2730: 55,
    2700: 55,
    1830: 50,
    1800: 50
  }
  
  export function fitLine(dataset: Datum[], startMoveIndex: number = 0, endMoveIndex: number): { slope: number, intercept: number } {
    if (startMoveIndex >= endMoveIndex || endMoveIndex - startMoveIndex < 2) {
      console.warn('[TimeRating] Not enough data points to fit line, returning default values');
      return { slope: -2.0, intercept: 100 }; 
    }
  
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, count = 0;
  
    for (let i = startMoveIndex; i < endMoveIndex; i++) {
      if (i >= dataset.length) break; 
      
      const move = dataset[i];
      const x = move.moveNumber;
      const y = move.seconds;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
      count++;
    }
  
    
    if (count < 2 || (count * sumXX - sumX * sumX) === 0) {
      console.warn('[TimeRating] Cannot calculate slope (division by zero), returning default values');
      return { slope: -2.0, intercept: 100 };
    }
  
    const slope = (count * sumXY - sumX * sumY) / (count * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / count;
  
    return { slope, intercept };
  }
  
  export function calculateTimeRating(
    dataset: Datum[],
    timeControl: number | undefined,
    increment: number | undefined,
    side: string,
    endMoveIndex: number
  ): number {
    const MAX_RATING = 3000;
  
   
    if (!timeControl) {
      console.warn(`[TimeRating] Invalid time control`);
      return 0;
    }
  
    
    if (dataset.length < 10) {
      console.warn(`[TimeRating] Dataset too small (${dataset.length} moves), returning default rating`);
      return 1500;
    }
  
    
    endMoveIndex = Math.min(endMoveIndex, dataset.length);
    
    const inc = increment || 0;
    let totalTimeKey = timeControl + inc;

    if(timeControl === 1800 && dataset.length <= 20){
      return 1500;
    }
  
   

    if(inc != 30){
      totalTimeKey = timeControl;
    }

    
    if (!BEST_MAP_SLOPE[totalTimeKey] || !BEST_MAP_INTERCEPT[totalTimeKey]) {
      console.warn(`[TimeRating] No best slope/intercept found for totalTimeKey=${totalTimeKey}`);
      return 0;
    }
  
    
    let openingSize = dataset.length >= 20 ? 9 : Math.floor(dataset.length * 0.3);
    
    
    const { slope: rawPlayerSlope, intercept: rawPlayerIntercept } = fitLine(dataset, openingSize, endMoveIndex);
  
    let normalizationFactor = 1;
    if (BEST_REF_MOVE_SIZE[totalTimeKey]) {
      const actualMoveCount = endMoveIndex - openingSize;
      normalizationFactor = Math.min(2, Math.max(0.5, BEST_REF_MOVE_SIZE[totalTimeKey] / Math.max(10, actualMoveCount)));
    }
  
    const bestSlope = BEST_MAP_SLOPE[totalTimeKey] * normalizationFactor;
    const bestIntercept = BEST_MAP_INTERCEPT[totalTimeKey] * normalizationFactor;
  
   
    const playerSlope = rawPlayerSlope;
    const playerIntercept = rawPlayerIntercept;
  
    console.log(`[TimeRating] ${side} side analysis:`);
    console.log(`Game length: ${dataset.length} moves, Using moves ${openingSize} to ${endMoveIndex}`);
    console.log(`Normalization factor: ${normalizationFactor.toFixed(2)}`);
    console.log(`Best Slope: ${bestSlope.toFixed(2)}, Player Slope: ${playerSlope.toFixed(2)}`);
    console.log(`Best Intercept: ${bestIntercept.toFixed(2)}, Player Intercept: ${playerIntercept.toFixed(2)}`);
    
   
    let slopeDeviation = 0;
    let interceptDeviation = 0;
    
    
    const slopeEpsilon = 0.01;
    const interceptEpsilon = 0.01;
    
    if (Math.abs(playerSlope) > Math.abs(bestSlope)) {
      slopeDeviation = Math.abs((bestSlope - playerSlope) / Math.max(slopeEpsilon, Math.abs(playerSlope)));
      interceptDeviation = Math.abs((playerIntercept - bestIntercept) / Math.max(interceptEpsilon, Math.abs(bestIntercept)));
    } else {
      slopeDeviation = Math.abs((playerSlope - bestSlope) / Math.max(slopeEpsilon, Math.abs(bestSlope)));
      interceptDeviation = Math.abs((playerIntercept - bestIntercept) / Math.max(interceptEpsilon, Math.abs(bestIntercept)));
    }
  
    
    slopeDeviation = Math.min(1, slopeDeviation);
    interceptDeviation = Math.min(1, interceptDeviation);
  
    console.log(`[TimeRating] Slope deviation: ${slopeDeviation.toFixed(3)}`);
    console.log(`[TimeRating] Intercept deviation: ${interceptDeviation.toFixed(3)}`);
  
    const SLOPE_WEIGHT = 0.7;
    const INTERCEPT_WEIGHT = 0.3;
    const totalDeviation = (slopeDeviation * SLOPE_WEIGHT) + (interceptDeviation * INTERCEPT_WEIGHT);
    
   
    let deviationAdjustment = 1;
    if (dataset.length < 20) {
    
      deviationAdjustment = 0.5 + ((dataset.length - 10) / 20);
    }
    
    const adjustedDeviation = totalDeviation * deviationAdjustment;
    const rating = Math.max(0, Math.round(MAX_RATING * (1 - Math.min(1, adjustedDeviation))));
  
    console.log(`[TimeRating] Total deviation: ${totalDeviation.toFixed(3)}, Adjusted: ${adjustedDeviation.toFixed(3)}`);
    console.log(`[TimeRating] Final calculated rating: ${rating}`);
    console.log('[TimeRating] Final Rating', rating)
    return rating;
  }