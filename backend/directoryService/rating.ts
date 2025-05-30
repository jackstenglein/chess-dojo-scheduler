'use strict';

import {
    compareRoles,
    Directory,
    DirectoryAccessRole,
    DirectoryItemTypes,
    DirectoryVisibility,
} from '@jackstenglein/chess-dojo-common/src/database/directory';

import { RatingSystem, getCohortForGivenRating, getNormalizedRating } from './ratingtypes';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { getAccessRole } from './access';
import {
    ApiError,
    errToApiGatewayProxyResultV2,
    parsePathParameters,
    requireUserInfo,
    success,
} from './api';
import { fetchDirectory, getDirectorySchema } from './get';

/**
 * Handles requests to the get directory API. Returns an error if the directory does
 * not exist or is private and the caller does not have viewer access. Calculates and
 * returns the performance rating for the given username and rating system.
 * @param event The API gateway event that triggered the request.
 * @returns The performance rating object.
 */
export const handlerV2: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: %j', event);

        const userInfo = requireUserInfo(event);
        const request = parsePathParameters(event, getDirectorySchema);
        let directory = await fetchDirectory(request.owner, request.id);

        if (!directory) {
            throw new ApiError({
                statusCode: 404,
                publicMessage: 'Directory not found',
            });
        }

        const accessRole = await getAccessRole({
            owner: directory.owner,
            id: directory.id,
            username: userInfo.username,
            directory,
        });
        const isViewer = compareRoles(DirectoryAccessRole.Viewer, accessRole);

        if (directory.visibility === DirectoryVisibility.PRIVATE && !isViewer) {
            throw new ApiError({
                statusCode: 403,
                publicMessage:
                    'This directory is private. Performance rating cannot be generated.',
            });
        }

        const queryParams = event.queryStringParameters || {};
        const username = queryParams.username;
        const ratingSystemQuery = queryParams.ratingsystem;
        
        

        if (!username || !ratingSystemQuery ) {
            throw new ApiError({
                statusCode: 400,
                publicMessage: 'Missing required query parameters: username and ratingsystem',
            });
        }

        const ratingSystem = convertQueryParamToRatingSystem(ratingSystemQuery);
        

        const performanceRating = getPerformanceRating(username, directory, ratingSystem);

        return success({ performanceRating });
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

// export enum RatingSystem {
//     Chesscom = 'CHESSCOM',
//     Lichess = 'LICHESS',
//     Fide = 'FIDE',
//     Uscf = 'USCF',
//     Ecf = 'ECF',
//     Cfc = 'CFC',
//     Dwz = 'DWZ',
//     Acf = 'ACF',
//     Knsb = 'KNSB',
//     Custom = 'CUSTOM',
//     Custom2 = 'CUSTOM_2',
//     Custom3 = 'CUSTOM_3',
// }

function convertQueryParamToRatingSystem(query: string): RatingSystem {
    switch (query.toLowerCase()) {
        case "chesscom":
            return RatingSystem.Chesscom;
        case "lichess":
            return RatingSystem.Lichess;
        case "fide":
            return RatingSystem.Fide;
        case "uscf":
            return RatingSystem.Uscf;
        case "ecf":
            return RatingSystem.Ecf;
        case "cfc":
            return RatingSystem.Cfc;
        case "dwz":
            return RatingSystem.Dwz;
        case "acf":
            return RatingSystem.Acf;
        case "knsb":
            return RatingSystem.Knsb;
        case "custom":
            return RatingSystem.Custom;
        case "custom_2":
            return RatingSystem.Custom2;
        case "custom_3":
            return RatingSystem.Custom3;
        default:
            throw new Error(`Unknown rating system: ${query}`);
    }
}

interface PerformanceRatingMetric {
    combinedRating: number,
    normalizedCombinedRating: number,
    whiteRating: number,
    normalizedWhiteRating: number,
    blackRating: number,
    normalizedBlackRating: number,
    winRatio: number,
    drawRatio: number, 
    lossRatio: number,
    cohortRatings: Record<string, CohortRatingMetric>;
}

interface CohortRatingMetric {
    rating: number;
    oppRatings: number[];
    gamesCount: number;
    ratios: number[];
}

const fideDpTable: Record<number, number> = {
    1.00: 800,
    0.99: 677,
    0.98: 589,
    0.97: 538,
    0.96: 501,
    0.95: 470,
    0.94: 444,
    0.93: 422,
    0.92: 401,
    0.91: 383,
    0.90: 366,
    0.89: 351,
    0.88: 336,
    0.87: 322,
    0.86: 309,
    0.85: 296,
    0.84: 284,
    0.83: 273,
    0.82: 262,
    0.81: 251,
    0.80: 240,
    0.79: 230,
    0.78: 220,
    0.77: 211,
    0.76: 202,
    0.75: 193,
    0.74: 184,
    0.73: 175,
    0.72: 166,
    0.71: 158,
    0.70: 149,
    0.69: 141,
    0.68: 133,
    0.67: 125,
    0.66: 117,
    0.65: 110,
    0.64: 102,
    0.63: 95,
    0.62: 87,
    0.61: 80,
    0.60: 72,
    0.59: 65,
    0.58: 57,
    0.57: 50,
    0.56: 43,
    0.55: 36,
    0.54: 29,
    0.53: 21,
    0.52: 14,
    0.51: 7,
    0.50: 0,
    0.49: -7,
    0.48: -14,
    0.47: -21,
    0.46: -29,
    0.45: -36,
    0.44: -43,
    0.43: -50,
    0.42: -57,
    0.41: -65,
    0.40: -72,
    0.39: -80,
    0.38: -87,
    0.37: -95,
    0.36: -102,
    0.35: -110,
    0.34: -117,
    0.33: -125,
    0.32: -133,
    0.31: -141,
    0.30: -149,
    0.29: -158,
    0.28: -166,
    0.27: -175,
    0.26: -184,
    0.25: -193,
    0.24: -202,
    0.23: -211,
    0.22: -220,
    0.21: -230,
    0.20: -240,
    0.19: -251,
    0.18: -262,
    0.17: -273,
    0.16: -284,
    0.15: -296,
    0.14: -309,
    0.13: -322,
    0.12: -336,
    0.11: -351,
    0.10: -366,
    0.09: -383,
    0.08: -401,
    0.07: -422,
    0.06: -444,
    0.05: -470,
    0.04: -501,
    0.03: -538,
    0.02: -589,
    0.01: -677,
    0.00: -800
  };
  

// loop over all cohort keys and calculate rating for that key and return it
// avg rating of that cohort is avg of opps ratings []
// calculate score wins (winCount) + 0.5 (drawCount) + 0 (0) 
// at least for the score we don't need the loss, but we might need the loss for loss rate for cohorts but we don't need that?
// fideTable[key] where key = score / oppRating.length
// oppCohortRating is avg of opp Rating[] + fideTable[score / oppRating.length]

function getCombinedRating(white: number, black: number): number {
  if (white > 0 && black > 0) {
    return Math.round((white + black) / 2);
  }
  return Math.round(white > 0 ? white : black);
}

export function getPerformanceRating(
    playername: string,
    userDirectory: Directory,
    ratingSystem: RatingSystem,
): PerformanceRatingMetric {
    const defaultRating = 1500;
    let wins = 0, whiteWins = 0, blackWins = 0;
    let draws = 0, whiteDraws = 0, blackDraws = 0;
    let losses = 0, whiteLoss = 0, blackLoss = 0;
    let total = 0;

    const cohortRatings: Map<string,CohortRatingMetric> = new Map();

   
    const oppBlackAvgRating: number[] = [];
    const oppWhiteAvgRating: number[] = [];

    const checkPlayerName = playername.toLowerCase();

    userDirectory.itemIds.forEach((currentId) => {
        const currentItem = userDirectory.items[currentId];
        if (currentItem.type !== DirectoryItemTypes.OWNED_GAME || !currentItem.metadata.result) {
            return;
        }

        total++;
        const { white, black, result, whiteElo, blackElo } = currentItem.metadata;

        const updateStats = (isWin: boolean, isDraw: boolean, isWhite: boolean, oppElo: string | undefined) => {
            const rating = oppElo ? parseInt(oppElo) : defaultRating;
            const oppCohort = getCohortForGivenRating(rating, ratingSystem);
            
            if(oppCohort){
                if(!cohortRatings.has(oppCohort)){
                    const ratios: number[] = [0, 0, 0]; //w/d/l
                    if(isWin){
                        ratios[0] = 1
                    }else if(isDraw){
                        ratios[1] = 0.5
                    }
                    const metric: CohortRatingMetric = {
                        rating: 0,
                        oppRatings: [rating],
                        gamesCount: 1,
                        ratios: ratios,
                    }
                    cohortRatings.set(oppCohort, metric);
                }else{
                    const updatedMetric = cohortRatings.get(oppCohort);
                    if(updatedMetric){
                        updatedMetric.oppRatings.push(rating);
                        updatedMetric.gamesCount = updatedMetric.oppRatings.length;
                        if(isWin){
                            updatedMetric.ratios[0] = updatedMetric.ratios[0] + 1;
                        }else if(isDraw){
                            updatedMetric.ratios[1] = updatedMetric.ratios[1] + 0.5;
                        }
                    }
                    
                }
            }

            (isWhite ? oppBlackAvgRating : oppWhiteAvgRating).push(rating);

            if (isWin) {
                wins++;
                isWhite ? whiteWins++ : blackWins++;
            } else if (isDraw) {
                draws++;
                isWhite ? whiteDraws++ : blackDraws++;
            } else {
                losses++;
                isWhite ? whiteLoss++ : blackLoss++;
            }
        };

        if (white.toLowerCase().includes(checkPlayerName)) {
            if (result === "1-0") updateStats(true, false, true, blackElo);
            else if (result === "0-1") updateStats(false, false, true, blackElo);
            else if (result === "1/2-1/2") updateStats(false, true, true, blackElo);
        } else if (black.toLowerCase().includes(checkPlayerName)) {
            if (result === "0-1") updateStats(true, false, false, whiteElo);
            else if (result === "1-0") updateStats(false, false, false, whiteElo);
            else if (result === "1/2-1/2") updateStats(false, true, false, whiteElo);
        }
    });

    if (total === 0) {
        return {
            combinedRating: 0,
            normalizedCombinedRating: 0,
            whiteRating: 0,
            normalizedWhiteRating: 0,
            blackRating: 0,
            normalizedBlackRating: 0,
            winRatio: 0,
            drawRatio: 0,
            lossRatio: 0,
            cohortRatings: {}
        };
    }

    const calculateAverage = (ratings: number[]) =>
        Math.round(ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length);

    const totalWhiteAvg = calculateAverage(oppBlackAvgRating);
    const totalBlackAvg = calculateAverage(oppWhiteAvgRating);

    const totalScorePercent = parseFloat((((1) * wins + (0.5) * draws) / total).toFixed(2));
    const totalWhiteScorePercent = parseFloat((((1) * whiteWins + (0.5) * whiteDraws) / total).toFixed(2));
    const totalBlackScorePercent = parseFloat((((1) * blackWins +(0.5) * blackDraws) / total).toFixed(2));

    const calculateRating = (avg: number, scorePercent: number) =>
        avg + fideDpTable[scorePercent];

    const whiteRating =  Math.round(calculateRating(totalWhiteAvg, totalWhiteScorePercent));
    const blackRating = Math.round(calculateRating(totalBlackAvg, totalBlackScorePercent));
    const combinedRating = getCombinedRating(whiteRating, blackRating)
    const combinedNormalRating = getNormalizedRating(combinedRating, ratingSystem);
    const normalizedWhiteRating = getNormalizedRating(whiteRating, ratingSystem);
    const normalizedBlackRating = getNormalizedRating(blackRating, ratingSystem);
    const winRatio = Math.round(parseFloat((wins / total).toFixed(2)) * 100);
    const drawRatio = Math.round(parseFloat((draws / total).toFixed(2)) * 100);
    const lossRatio = Math.round(parseFloat((losses / total).toFixed(2)) * 100);

    cohortRatings.forEach((metric) => {
        const avgOppRating = metric.oppRatings.length > 0
            ? Math.round(calculateAverage(metric.oppRatings))
            : 0;
        const scorePercent = metric.gamesCount > 0
            ? parseFloat((metric.ratios.reduce((sum, r) => sum + r, 0) / metric.gamesCount).toFixed(2))
            : 0;
        const cohortKeyRating = avgOppRating + (fideDpTable[scorePercent] ?? 0);    
        metric.rating = getNormalizedRating(cohortKeyRating, ratingSystem);
    });

    
    const cohortRatingsObject: Record<string, CohortRatingMetric> = {};
    cohortRatings.forEach((value, key) => {
        cohortRatingsObject[key] = value;
    });

    return {
        combinedRating: combinedRating,
        normalizedCombinedRating: combinedNormalRating,
        whiteRating: whiteRating,
        normalizedWhiteRating: normalizedWhiteRating,
        blackRating: blackRating,
        normalizedBlackRating: normalizedBlackRating,
        winRatio: winRatio,
        drawRatio: drawRatio,
        lossRatio: lossRatio,
        cohortRatings: cohortRatingsObject
    };
}
