import { TimeFormat } from '../database/user';

export function toDojoTimeString(
    date: Date,
    timeFormat?: TimeFormat,
    options?: Intl.DateTimeFormatOptions
): string {
    timeFormat = timeFormat || TimeFormat.TwelveHour;
    return date.toLocaleTimeString(undefined, {
        ...options,
        hour12: timeFormat === TimeFormat.TwelveHour,
    });
}
