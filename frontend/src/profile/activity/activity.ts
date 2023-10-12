import {
    CustomTask,
    Requirement,
    getCurrentCount,
    getCurrentScore,
    getTotalCount,
    getUnitScore,
} from '../../database/requirement';
import { TimelineEntry } from '../../database/timeline';
import { User } from '../../database/user';
import { PieChartData } from './PieChart';

export const CategoryColors: Record<string, string> = {
    'Welcome to the Dojo': '#c27ba0', // light magenta 1
    'Games + Analysis': '#ff9900', // orange
    Tactics: '#38761d', // dark green 2
    'Middlegames + Strategy': '#0000ff', // blue
    Endgame: '#674ea7', // dark purple 1
    Opening: '#cc0000', // dark red 1
    Graduation: '#f44336', // red
    'Non-Dojo': '#cccccc', // gray
};

export const ScoreCategories = [
    'Games + Analysis',
    'Middlegames + Strategy',
    'Tactics',
    'Endgame',
    'Opening',
];

export const RequirementColors = [
    '#c27ba0',
    '#ff9900',
    '#38761d',
    '#0000ff',
    '#351c75',
    '#cc0000',
    '#f44336',
];

/**
 * Timeframes that can be used as options when viewing a user's activity.
 */
export enum Timeframe {
    AllTime = 'ALL_TIME',
    Last7Days = 'LAST_7_DAYS',
    Last30Days = 'LAST_30_DAYS',
    Last90Days = 'LAST_90_DAYS',
    Last365Days = 'LAST_365_DAYS',
}

/**
 * Converts a Timeframe into a user-friendly display string.
 * @param t The Timeframe to convert.
 * @returns A user-friendly display string describing the Timeframe.
 */
export function displayTimeframe(t: Timeframe): string {
    switch (t) {
        case Timeframe.AllTime:
            return 'All Time';
        case Timeframe.Last7Days:
            return 'Last 7 Days';
        case Timeframe.Last30Days:
            return 'Last 30 Days';
        case Timeframe.Last90Days:
            return 'Last 90 Days';
        case Timeframe.Last365Days:
            return 'Last 365 Days';
    }
}

/**
 * The number of milliseconds in a single day.
 */
const DayInMilliseconds = 24 * 60 * 60 * 1000;

/**
 * Converts a Timeframe to an ISO string.
 * @param t The Timeframe to convert.
 * @returns An ISO string of the specified Timeframe, or an empty string if t is AllTime.
 */
function timeframeToISO(t: Timeframe): string {
    switch (t) {
        case Timeframe.AllTime:
            return '';
        case Timeframe.Last7Days:
            return new Date(Date.now() - 7 * DayInMilliseconds).toISOString();
        case Timeframe.Last30Days:
            return new Date(Date.now() - 30 * DayInMilliseconds).toISOString();
        case Timeframe.Last90Days:
            return new Date(Date.now() - 90 * DayInMilliseconds).toISOString();
        case Timeframe.Last365Days:
            return new Date(Date.now() - 365 * DayInMilliseconds).toISOString();
    }
}

/**
 * Calculates the Dojo score data for the provided parameters.
 * @param user The user to calculate data for.
 * @param cohort The cohort to use when calculating the data.
 * @param timeframe The Timeframe to use as a cut-off when calculating.
 * @param timeline The timeline entries to use for the score data.
 * @param category The category to calculate data for.
 * @param requirements The list of requirements to calculate data for.
 * @returns A list of PieChartData objects containing the Dojo score data.
 */
export function getScoreChartData(
    user: User,
    cohort: string,
    timeframe: Timeframe,
    timeline: TimelineEntry[],
    category: string,
    requirements: Requirement[]
): PieChartData[] {
    if (category) {
        return getCategoryScoreChartData(
            user,
            cohort,
            timeframe,
            timeline,
            category,
            requirements
        );
    }

    return getTimeframeScoreChartData(user, cohort, timeframe, timeline, requirements);
}

/**
 * Returns the all-time Dojo score data for the given user, cohort and requirements.
 * @param user The user to calculate the data for.
 * @param cohort The cohort to use when calculating the score chart data.
 * @param requirements The list of requirements to use when calculating the score chart data.
 * @returns A list of PieChartData objects containing the all time Dojo score data.
 */
function getAllTimeScoreChartData(
    user: User,
    cohort: string,
    requirements: Requirement[]
): PieChartData[] {
    const data: Record<string, PieChartData> = {};

    for (const requirement of requirements) {
        const category = requirement.category;
        const score = getCurrentScore(cohort, requirement, user.progress[requirement.id]);

        if (data[category]) {
            data[category].value += score;
        } else if (score > 0) {
            data[category] = {
                name: category,
                value: score,
                color: CategoryColors[category],
            };
        }
    }

    return Object.values(data);
}

/**
 * Returns the Dojo score data within a specific timeframe for the given user, cohort and requirements.
 * @param user The user to calculate the data for.
 * @param cohort The cohort to use when calculating the score chart data.
 * @param timeframe The Timeframe to use when calculating the data.
 * @param requirements The list of requirements to use when calculating the score chart data.
 * @returns A list of PieChartData objects containing the Dojo score data within the Timeframe.
 */
function getTimeframeScoreChartData(
    user: User,
    cohort: string,
    timeframe: Timeframe,
    timeline: TimelineEntry[],
    requirements: Requirement[]
): PieChartData[] {
    if (timeframe === Timeframe.AllTime) {
        return getAllTimeScoreChartData(user, cohort, requirements);
    }

    const data: Record<string, PieChartData> = {};
    const timeCutoff = timeframeToISO(timeframe);
    const requirementMap = requirements.reduce((m, r) => {
        m[r.id] = r;
        return m;
    }, {} as Record<string, Requirement>);

    for (const entry of timeline) {
        if (entry.cohort !== cohort || entry.requirementCategory === 'Non-Dojo') {
            continue;
        }
        const requirement = requirementMap[entry.requirementId];
        if (!requirement) {
            continue;
        }
        if (entry.createdAt < timeCutoff) {
            break;
        }

        let score = 0;
        if (requirement.totalScore) {
            if (entry.newCount === getTotalCount(cohort, requirement)) {
                score = requirement.totalScore;
            }
        } else {
            const unitScore = getUnitScore(cohort, requirement);
            score =
                Math.max(
                    entry.newCount - entry.previousCount - requirement.startCount,
                    0
                ) * unitScore;
        }

        if (data[requirement.category]) {
            data[requirement.category].value += score;
        } else if (score > 0) {
            data[requirement.category] = {
                name: requirement.category,
                value: score,
                color: CategoryColors[requirement.category],
            };
        }
    }

    return Object.values(data);
}

const numberedReqRegex = / #\d+$/;

/**
 * Calculates the Dojo score of a given category for the provided parameters.
 * @param user The user to calculate the dojo score for.
 * @param cohort The cohort to calculate the score for.
 * @param timeframe The Timeframe to use as a cut off when calculating the score.
 * @param timeline The timeline entries to use for the score data.
 * @param category The requirement category to calculate data for.
 * @param requirements The list of requirements to calculate data for.
 * @returns A list of PieChartData objects containing the Dojo score data.
 */
function getCategoryScoreChartData(
    user: User,
    cohort: string,
    timeframe: Timeframe,
    timeline: TimelineEntry[],
    category: string,
    requirements: Requirement[]
): PieChartData[] {
    if (timeframe === Timeframe.AllTime) {
        return getAllTimeCategoryScoreChartData(user, cohort, category, requirements);
    }

    const data: Record<string, PieChartData> = {};
    const timeCutoff = timeframeToISO(timeframe);
    const requirementMap = requirements.reduce((m, r) => {
        m[r.id] = r;
        return m;
    }, {} as Record<string, Requirement>);

    for (const entry of timeline) {
        if (entry.cohort !== cohort || entry.requirementCategory !== category) {
            continue;
        }
        const requirement = requirementMap[entry.requirementId];
        if (!requirement) {
            continue;
        }
        if (entry.createdAt < timeCutoff) {
            break;
        }

        let score = 0;
        if (requirement.totalScore) {
            if (entry.newCount === getTotalCount(cohort, requirement)) {
                score = requirement.totalScore;
            }
        } else {
            const unitScore = getUnitScore(cohort, requirement);
            score =
                Math.max(
                    entry.newCount - entry.previousCount - requirement.startCount,
                    0
                ) * unitScore;
        }
        if (score === 0) {
            continue;
        }

        let name = requirement.name;
        const result = numberedReqRegex.exec(name);
        if (result) {
            name = name.substring(0, result.index);
        }

        if (data[name]) {
            data[name].value += score;
            data[name].count =
                (data[name].count || 0) +
                Math.max(entry.newCount - entry.previousCount, 0);
        } else {
            data[name] = {
                name,
                value: score,
                color: RequirementColors[
                    Object.values(data).length % RequirementColors.length
                ],
                count: Math.max(entry.newCount - entry.previousCount, 0),
            };
        }
    }

    return Object.values(data);
}

/**
 * Returns the all-time Dojo score for the given user, cohort, category and requirements.
 * @param user The user to calculate the data for.
 * @param cohort The cohort to use when calculating the data.
 * @param category The requirement category to calculate data on.
 * @param requirements The list of requirements to use.
 * @returns A list of PieChartData objects containing the all-time Dojo score data for the given category.
 */
function getAllTimeCategoryScoreChartData(
    user: User,
    cohort: string,
    category: string,
    requirements: Requirement[]
): PieChartData[] {
    const data: Record<string, PieChartData> = {};

    for (const requirement of requirements) {
        if (category !== requirement.category) {
            continue;
        }

        const score = getCurrentScore(cohort, requirement, user.progress[requirement.id]);
        if (score === 0) {
            continue;
        }
        const count = getCurrentCount(cohort, requirement, user.progress[requirement.id]);

        let name = requirement.name;
        const result = numberedReqRegex.exec(name);
        if (result) {
            name = name.substring(0, result.index);
        }

        if (data[name]) {
            data[name].value += score;
            data[name].count = (data[name].count || 0) + count;
        } else {
            data[name] = {
                name,
                value: score,
                color: RequirementColors[
                    Object.values(data).length % RequirementColors.length
                ],
                count,
            };
        }
    }

    return Object.values(data);
}

/**
 * Calculates the time spent by the user for the specified parameters.
 * @param user The user to calculate the data for.
 * @param cohort The cohort to calculate data for.
 * @param timeframe The Timeframe to use as a cut off when calculating data.
 * @param timeline The timeline entries to use for the time data.
 * @param category The requirement category to calculate data for.
 * @param requirements The list of requirements to calculate data for.
 * @returns A list of PieChartData objects containing the time data.
 */
export function getTimeChartData(
    user: User,
    cohort: string,
    timeframe: Timeframe,
    timeline: TimelineEntry[],
    category: string,
    requirements: Requirement[]
): PieChartData[] {
    if (category) {
        return getCategoryTimeChartData(
            user,
            cohort,
            timeframe,
            timeline,
            category,
            requirements
        );
    }

    return getTimeframeTimeChartData(user, cohort, timeframe, timeline, requirements);
}

/**
 * Calculates the time spent by the user in the specified cohort and timeframe.
 * @param user The user to calculate the data for.
 * @param cohort The cohort to calculate data for.
 * @param timeframe The Timeframe to use as a cut off when calculating data.
 * @param timeline The timeline entries to use for the time data.
 * @param requirements The list of requirements to calculate data for.
 * @returns A list of PieChartData objects containing the time data.
 */
function getTimeframeTimeChartData(
    user: User,
    cohort: string,
    timeframe: Timeframe,
    timeline: TimelineEntry[],
    requirements: Requirement[]
): PieChartData[] {
    if (timeframe === Timeframe.AllTime) {
        return getAllTimeTimeChartData(user, cohort, requirements);
    }

    const data: Record<string, PieChartData> = {};
    const timeCutoff = timeframeToISO(timeframe);

    for (const entry of timeline) {
        if (entry.cohort !== cohort || entry.minutesSpent === 0) {
            continue;
        }
        if (entry.createdAt < timeCutoff) {
            break;
        }

        const categoryName = entry.requirementCategory;
        if (data[categoryName]) {
            data[categoryName].value += entry.minutesSpent;
        } else {
            data[categoryName] = {
                name: categoryName,
                value: entry.minutesSpent,
                color: CategoryColors[categoryName],
            };
        }
    }

    return Object.values(data);
}

/**
 * Calculates the all-time time spent for the given user, cohort and requirements.
 * @param user The user to calculate the data for.
 * @param cohort The cohort to calculate the data for.
 * @param requirements The list of requirements to calculate the data for.
 * @returns A list of PieChartData objects containing the all-time time data.
 */
function getAllTimeTimeChartData(
    user: User,
    cohort: string,
    requirements: Requirement[]
): PieChartData[] {
    const requirementMap =
        requirements.reduce((map, r) => {
            map[r.id] = r;
            return map;
        }, {} as Record<string, Requirement | CustomTask>) ?? {};

    user.customTasks?.forEach((t) => {
        requirementMap[t.id] = t;
    });

    const data: Record<string, PieChartData> = {};
    Object.values(user.progress).forEach((progress) => {
        if (!progress.minutesSpent || !progress.minutesSpent[cohort]) {
            return;
        }
        const requirement = requirementMap[progress.requirementId];
        if (!requirement) {
            return;
        }
        const categoryName = requirement.category;
        if (data[categoryName]) {
            data[categoryName].value += progress.minutesSpent[cohort];
        } else {
            data[categoryName] = {
                name: categoryName,
                value: progress.minutesSpent[cohort],
                color: CategoryColors[requirement.category],
            };
        }
    });

    return Object.values(data);
}

/**
 * Calculates the time spent on a given category for the provided parameters.
 * @param user The user to calculate the time spent for.
 * @param cohort The cohort to calculate the time spent for.
 * @param timeframe The Timeframe to use as a cut off when calculating the time spent.
 * @param timeline The timeline entries to use for the time data.
 * @param category The category to calculate data for.
 * @param requirements The list of requirements to calculate data for.
 * @returns A list of PieChartData objects containing the time data.
 */
function getCategoryTimeChartData(
    user: User,
    cohort: string,
    timeframe: Timeframe,
    timeline: TimelineEntry[],
    category: string,
    requirements: Requirement[]
): PieChartData[] {
    if (timeframe === Timeframe.AllTime) {
        return getAllTimeCategoryTimeChartData(user, cohort, category, requirements);
    }

    const data: Record<string, PieChartData> = {};
    const timeCutoff = timeframeToISO(timeframe);

    for (const entry of timeline) {
        if (
            entry.cohort !== cohort ||
            entry.requirementCategory !== category ||
            entry.minutesSpent === 0 ||
            entry.requirementName === ''
        ) {
            continue;
        }

        if (entry.createdAt < timeCutoff) {
            break;
        }

        let name = entry.requirementName;
        const result = numberedReqRegex.exec(name);
        if (result) {
            name = name.substring(0, result.index);
        }

        if (data[name]) {
            data[name].value += entry.minutesSpent;
        } else {
            data[name] = {
                name,
                value: entry.minutesSpent,
                color: RequirementColors[
                    Object.values(data).length % RequirementColors.length
                ],
            };
        }
    }

    return Object.values(data);
}

/**
 * Calculates the all-time time spent by the given user in the provided cohort and category.
 * @param user The user to calculate the data for.
 * @param cohort The cohort to use when calculating the data.
 * @param category The requirement category to calculate data for.
 * @param requirements The list of requirements to use.
 * @returns A list of PieChartData objects containing the all-time time data for the given category.
 */
function getAllTimeCategoryTimeChartData(
    user: User,
    cohort: string,
    category: string,
    requirements: Requirement[]
): PieChartData[] {
    const data: Record<string, PieChartData> = {};

    for (const requirement of requirements) {
        if (category !== requirement.category) {
            continue;
        }
        const progress = user.progress[requirement.id];
        if (!progress || !progress.minutesSpent || !progress.minutesSpent[cohort]) {
            continue;
        }

        let name = requirement.name;
        const result = numberedReqRegex.exec(name);
        if (result) {
            name = name.substring(0, result.index);
        }

        if (data[name]) {
            data[name].value += progress.minutesSpent[cohort];
        } else {
            data[name] = {
                name,
                value: progress.minutesSpent[cohort],
                color: RequirementColors[
                    Object.values(data).length % RequirementColors.length
                ],
            };
        }
    }
    if (category === 'Non-Dojo') {
        for (const task of user.customTasks || []) {
            const progress = user.progress[task.id];
            if (!progress || !progress.minutesSpent || !progress.minutesSpent[cohort]) {
                continue;
            }

            let name = task.name;
            data[name] = {
                name,
                value: progress.minutesSpent[cohort],
                color: RequirementColors[
                    Object.values(data).length % RequirementColors.length
                ],
            };
        }
    }
    return Object.values(data);
}
