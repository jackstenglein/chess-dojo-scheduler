/**
 * Returns the ISO 8601 string (UTC, with `Z`) representing the instant of
 * **local midnight** at the start of the day for the provided value.
 *
 * Notes:
 * - The returned string is in UTC (e.g. "2025-10-09T00:00:00.000Z"),
 *   representing the moment that local midnight occurs in your timezone.
 * - For input "YYYY-MM-DD" strings, this is interpreted as a local date (not UTC).
 * @param value A Date or ISO 8601 string.
 */
export function startOfLocalDayIso(value: string | Date): string {
    const date = toLocalDate(value);
    const start = startOfLocalDay(date);
    return start.toISOString();
}

/**
 * Adds the provided number of days (positive or negative) to the given value,
 * returning the ISO 8601 string (UTC, with `Z`) for the start of that local day.
 * @param value A Date or ISO 8601 string.
 * @param days The number of days to add.
 */
export function addLocalDaysIso(value: string | Date, days: number): string {
    const date = toLocalDate(value);
    const start = startOfLocalDay(date);
    start.setDate(start.getDate() + days); // respects month/year rollover & DST
    start.setHours(0, 0, 0, 0); // re-normalize in case a rare DST edge nudged time
    return start.toISOString();
}

/**
 * Returns true if the inputs fall on the same local calendar day.
 * @param a A Date or ISO 8601 string.
 * @param b A Date or ISO 8601 string.
 */
export function isSameLocalDay(a: string | Date, b: string | Date): boolean {
    const da = toLocalDate(a);
    const db = toLocalDate(b);
    return (
        da.getFullYear() === db.getFullYear() &&
        da.getMonth() === db.getMonth() &&
        da.getDate() === db.getDate()
    );
}
/* ===================== Internal helpers ===================== */

/**
 * Parse input into a Date in local time context.
 * - Bare "YYYY-MM-DD" is treated as local midnight that day.
 * - Other strings are delegated to `Date.parse` (which respects provided offsets,
 *   and treats "YYYY-MM-DDTHH:mm:ss" without a zone as local time).
 * - Throws on invalid dates for predictability.
 */
function toLocalDate(value: string | Date): Date {
    if (value instanceof Date) {
        const d = new Date(value.getTime()); // clone
        ensureValidDate(d, 'Date');
        return d;
    }

    if (typeof value === 'string') {
        // Treat bare date as local date (avoid spec’s UTC interpretation).
        const bareDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
        if (bareDate) {
            const [, y, m, d] = bareDate;
            const local = new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0);
            ensureValidDate(local, `date string "${value}"`);
            return local;
        }

        const parsed = new Date(value); // handles offsets or local clock for naive date-time
        ensureValidDate(parsed, `date string "${value}"`);
        return parsed;
    }

    // Should not happen with current typings; keep as a safety net.
    throw new TypeError('toLocalDate: value must be a string or Date');
}

/** Ensure date is valid; otherwise throw a descriptive error. */
function ensureValidDate(d: Date, label: string): void {
    if (isNaN(d.getTime())) {
        throw new RangeError(`Invalid ${label}; could not construct a valid Date`);
    }
}

/** Create a new Date representing local midnight for the given Date (local time). */
function startOfLocalDay(d: Date): Date {
    const start = new Date(d.getTime());
    start.setHours(0, 0, 0, 0);
    return start;
}
