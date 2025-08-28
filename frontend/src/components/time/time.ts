export const ONE_WEEK_IN_MS = 1000 * 60 * 60 * 24 * 7;
export const ONE_YEAR_IN_MS = 1000 * 60 * 60 * 24 * 365;

export const dateOlderThanAYear = (date: Date): boolean => {
    return (new Date().getTime() - date.getTime()) > ONE_YEAR_IN_MS;
}