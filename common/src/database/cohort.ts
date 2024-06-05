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

    let maxCohort =
        range.split('-').length > 1 ? parseInt(range.split('-')[1]) : Infinity;
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
