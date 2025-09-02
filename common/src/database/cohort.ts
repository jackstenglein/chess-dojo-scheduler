import { isCustom, ratingBoundaries } from '../ratings/ratings';
import { RatingSystem } from './user';

/** The cohorts users can be members of in the Dojo. */
export const dojoCohorts = [
    '0-300',
    '300-400',
    '400-500',
    '500-600',
    '600-700',
    '700-800',
    '800-900',
    '900-1000',
    '1000-1100',
    '1100-1200',
    '1200-1300',
    '1300-1400',
    '1400-1500',
    '1500-1600',
    '1600-1700',
    '1700-1800',
    '1800-1900',
    '1900-2000',
    '2000-2100',
    '2100-2200',
    '2200-2300',
    '2300-2400',
    '2400+',
];

/**
 * Returns the given cohort range as an array of 2 numbers. Ex: 0-1500
 * would return [0, 1500]. For ranges like 2000+, the max cohort is set to Infinity
 * (IE: [2000, Infinity]). If range is not provided or the min cohort is NaN, [-1, -1]
 * is returned.
 * @param range The cohort range to convert.
 * @returns The min and max cohort as numbers.
 */
export function getCohortRangeInt(range?: string): [number, number] {
    if (!range) {
        return [-1, -1];
    }

    const minCohort = parseInt(range);
    if (isNaN(minCohort)) {
        return [-1, -1];
    }

    let maxCohort = range.split('-').length > 1 ? parseInt(range.split('-')[1]) : Infinity;
    if (isNaN(maxCohort)) {
        maxCohort = Infinity;
    }

    return [minCohort, maxCohort];
}

/**
 * Returns true if the provided cohort is in the given half-open range [inclusive, exclusive).
 * @param cohort The cohort to check.
 * @param range The range to check. Does not have to be a real cohort (Ex: 1500-2000 or 2000+).
 */
export function isCohortInRange(cohort: string | undefined, range: string): boolean {
    if (!cohort) {
        return false;
    }

    const [minCohort, maxCohort] = getCohortRangeInt(range);
    const compareCohort = parseInt(cohort);
    return compareCohort >= minCohort && compareCohort < maxCohort;
}

/**
 * Converts the rating in the given rating system to a Dojo cohort.
 * @param rating The rating to convert.
 * @param ratingSystem The rating system to convert from.
 * @returns The cohort or undefined if the rating system is custom.
 */
export function ratingToCohort(rating: number, ratingSystem: RatingSystem): string | undefined {
    if (isCustom(ratingSystem)) {
        return;
    }
    for (const cohort of dojoCohorts) {
        if (ratingBoundaries[cohort] && ratingBoundaries[cohort][ratingSystem] >= rating) {
            return cohort;
        }
    }
    return '2400+';
}
