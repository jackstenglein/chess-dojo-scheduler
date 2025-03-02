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
    minutesPerDay: DAY_NAMES.map(() => 60),
} as const;

/** The minimum minutes to spend per task. */
export const DEFAULT_MINUTES_PER_TASK = 30;
