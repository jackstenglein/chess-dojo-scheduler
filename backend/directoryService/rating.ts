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
        const playerCohort = queryParams.playerCohort;
        

        if (!username || !ratingSystemQuery || !playerCohort) {
            throw new ApiError({
                statusCode: 400,
                publicMessage: 'Missing required query parameters: username and ratingsystem',
            });
        }

        const ratingSystem = convertQueryParamToRatingSystem(ratingSystemQuery);
        

        const performanceRating = getPerformanceRating(username, directory, ratingSystem, playerCohort);

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
    lossRatio: number
    equalCohortRating: number,
    previousCohortRating: number,
    prePreviousCohortRating: number,
    nextCohortRating: number,
    nextNextCohortRating: number
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
  



export function getPerformanceRating(
    playername: string,
    userDirectory: Directory,
    ratingSystem: RatingSystem,
    playerCohort: string,
): PerformanceRatingMetric {
    const defaultRating = 1500;
    let wins = 0, whiteWins = 0, blackWins = 0;
    let draws = 0, whiteDraws = 0, blackDraws = 0;
    let losses = 0, whiteLoss = 0, blackLoss = 0;
    let total = 0;

    const cohortWDLCounts: Record<string, number[]> = {
        playerCohort: [0, 0, 0],
        previousCohort: [0, 0, 0],
        prepreviousCohort: [0, 0, 0],
        nextCohort: [0, 0, 0],
        nextNextCohort: [0, 0, 0],
    };

    const cohortRanges: Record<string, number[]> = {
        playerCohort: [],
        previousCohort: [],
        prepreviousCohort: [],
        nextCohort: [],
        nextNextCohort: [],
    };

   
    const oppBlackAvgRating: number[] = [];
    const oppWhiteAvgRating: number[] = [];

    const currentCohortStart = parseInt(playerCohort.split('-')[0]);
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
            const oppCohortStart = oppCohort ? parseInt(oppCohort.split('-')[0]) : 0;

            const cohortKey = oppCohortStart === currentCohortStart + 200
                ? 'nextNextCohort'
                : oppCohortStart === currentCohortStart + 100
                ? 'nextCohort'
                : oppCohortStart === currentCohortStart
                ? 'playerCohort'
                : oppCohortStart === currentCohortStart - 100
                ? 'previousCohort'
                : oppCohortStart === currentCohortStart - 200
                ? 'prepreviousCohort'
                : null;

            if (cohortKey) {
                cohortRanges[cohortKey].push(rating);
                cohortWDLCounts[cohortKey][isWin ? 0 : isDraw ? 1 : 2]++;
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
            equalCohortRating: 0,
            previousCohortRating: 0,
            prePreviousCohortRating: 0,
            nextCohortRating: 0,
            nextNextCohortRating: 0,
        };
    }

    const calculateAverage = (ratings: number[]) =>
        Math.round(ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length);

    const totalWhiteAvg = calculateAverage(oppBlackAvgRating);
    const totalBlackAvg = calculateAverage(oppWhiteAvgRating);

    const calculateCohortAverage = (key: string) =>
        calculateAverage(cohortRanges[key]);

    const totalEqualCohortAvg = calculateCohortAverage('playerCohort');
    const totalPreviousCohortAvg = calculateCohortAverage('previousCohort');
    const totalPrePreviousCohortAvg = calculateCohortAverage('prepreviousCohort');
    const totalNextCohortAvg = calculateCohortAverage('nextCohort');
    const totalNextNextCohortAvg = calculateCohortAverage('nextNextCohort');

    const totalScorePercent = parseFloat(((wins + draws + losses) / total).toFixed(2));
    const totalWhiteScorePercent = parseFloat(((whiteWins + whiteDraws + whiteLoss) / total).toFixed(2));
    const totalBlackScorePercent = parseFloat(((blackWins + blackDraws + blackLoss) / total).toFixed(2));

    const calculateRating = (avg: number, scorePercent: number) =>
        avg + fideDpTable[scorePercent];

    const whiteRating =  calculateRating(totalWhiteAvg, totalWhiteScorePercent);
    const blackRating = calculateRating(totalBlackAvg, totalBlackScorePercent);
    const combinedRating = Math.round((whiteRating + blackRating)/2);
    const combinedNormalRating = getNormalizedRating(combinedRating, ratingSystem);
    const normalizedWhiteRating = getNormalizedRating(whiteRating, ratingSystem);
    const normalizedBlackRating = getNormalizedRating(blackRating, ratingSystem);
    const winRatio = Math.round(parseFloat((wins / total).toFixed(2)) * 100);
    const drawRatio = Math.round(parseFloat((draws / total).toFixed(2)) * 100);
    const lossRatio = Math.round(parseFloat((losses / total).toFixed(2)) * 100);
    const equalCohortRating = calculateRating(totalEqualCohortAvg, totalScorePercent);
    const previousCohortRating = calculateRating(totalPreviousCohortAvg, totalScorePercent);
    const prePreviousCohortRating = calculateRating(totalPrePreviousCohortAvg, totalScorePercent);
    const nextCohortRating = calculateRating(totalNextCohortAvg, totalScorePercent);
    const nextNextCohortRating = calculateRating(totalNextNextCohortAvg, totalScorePercent);

    // Normalize the cohort ratings
    const normalizedEqualCohortRating = getNormalizedRating(equalCohortRating, ratingSystem);
    const normalizedPreviousCohortRating = getNormalizedRating(previousCohortRating, ratingSystem);
    const normalizedPrePreviousCohortRating = getNormalizedRating(prePreviousCohortRating, ratingSystem);
    const normalizedNextCohortRating = getNormalizedRating(nextCohortRating, ratingSystem);
    const normalizedNextNextCohortRating = getNormalizedRating(nextNextCohortRating, ratingSystem);

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
        equalCohortRating: normalizedEqualCohortRating,
        previousCohortRating: normalizedPreviousCohortRating,
        prePreviousCohortRating: normalizedPrePreviousCohortRating,
        nextCohortRating: normalizedNextCohortRating,
        nextNextCohortRating: normalizedNextNextCohortRating,
    };
}
