import { WorkGoalSettings } from '@/database/user';

/** The names of the days of the week. */
export const DAY_NAMES = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
] as const;

/** The default work goal settings if the user has not saved any. */
export const DEFAULT_WORK_GOAL: WorkGoalSettings = {
    minutesPerDay: DAY_NAMES.map(() => 45),
    minutesPerTask: 30,
} as const;
