export const tournamentsClock = new Date('2023-09-13T05:00:00.000Z');

/**
 * Returns the most recent Sunday before the given date.
 * @param d The date to get the Sunday for.
 * @returns The most recent Sunday before the given date.
 */
function getSunday(d: Date): Date {
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
}

/**
 * Returns a new date created by adding the given number of days to d.
 * @param d The date to add days to.
 * @param count The number of days to add.
 * @returns A new date with the number of days added to d.
 */
function addDays(d: Date, count: number): Date {
    const result = new Date(d);
    result.setDate(d.getDate() + count);
    return result;
}

const sunday = getSunday(new Date());

export const dateMapper: Record<string, string> = {
    '2023-09-10': sunday.toISOString().slice(0, 10),
    '2023-09-11': addDays(sunday, 1).toISOString().slice(0, 10),
    '2023-09-12': addDays(sunday, 2).toISOString().slice(0, 10),
    '2023-09-13': addDays(sunday, 3).toISOString().slice(0, 10),
    '2023-09-14': addDays(sunday, 4).toISOString().slice(0, 10),
    '2023-09-15': addDays(sunday, 5).toISOString().slice(0, 10),
    '2023-09-16': addDays(sunday, 6).toISOString().slice(0, 10),
};

export interface Event {
    startTime: string;
    endTime: string;
}
