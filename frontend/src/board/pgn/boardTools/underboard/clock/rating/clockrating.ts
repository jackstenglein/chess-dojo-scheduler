import { Datum } from "../ClockUsage";

const AVG_BEST_90_30_INTEGRAL = 6350;
const MAX_RATING = 3000;

/**
 * Approximates the definite integral of a function using the Trapezoidal Rule.
 *
 * @param func - The function to integrate,
 * @param lowerLimit - The start of the interval (a)
 * @param upperLimit - The end of the interval (b)
 * @param numberOfSubIntervals - The number of trapezoids (n). Higher means more accuracy.
 * @returns The approximate value of the integral from a to b.
 */
function trapezoidalRule(
    func: (x: number, dataset: Datum[]) => number,
    lowerLimit: number,
    upperLimit: number,
    numberOfSubIntervals: number,
    dataset: Datum[]
  ): number {
    const intervalWidth = (upperLimit - lowerLimit) / numberOfSubIntervals;
    let totalArea = func(lowerLimit, dataset) + func(upperLimit, dataset);
  
    for (let i = 1; i < numberOfSubIntervals; i++) {
      const x = lowerLimit + i * intervalWidth;
      totalArea += 2 * func(x, dataset);
    }
  
    return (intervalWidth / 2) * totalArea;
  }


  function funcMoveToSeconds(xMove: number, dataSet: Datum[]): number{

    const dataVals = dataSet.values();
    let secs = 0;

    dataVals.forEach((data) => {
      if(data.moveNumber === xMove){
        secs = data.seconds;
      }
    })

    return secs;
  }


  export function calculateIntegral(dataSet: Datum[]): number {
    return trapezoidalRule(funcMoveToSeconds, 0, dataSet.length, dataSet.length, dataSet) ;
  }

  export function calculateTimeRating(dataset: Datum[]): number {
    const currentIntegral = calculateIntegral(dataset);

    if(currentIntegral > AVG_BEST_90_30_INTEGRAL){
       return Math.round((AVG_BEST_90_30_INTEGRAL / currentIntegral) * MAX_RATING);
    }else if(AVG_BEST_90_30_INTEGRAL > currentIntegral){
      return Math.round((currentIntegral/ AVG_BEST_90_30_INTEGRAL) * MAX_RATING);
    }else{
      return MAX_RATING;
    }
  }
  
  