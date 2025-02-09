import {
    CustomTask,
    Requirement,
    RequirementCategory,
    RequirementProgress,
    getCurrentCount,
    getRemainingCategoryScorePercent,
    getRemainingScore,
    getTotalCount,
    getTotalScore,
    getUnitScore,
    isComplete,
    isRequirement,
} from '@/database/requirement';
import { ALL_COHORTS, User, WeeklyPlan, WorkGoalSettings, isFree } from '@/database/user';
import { DEFAULT_WORK_GOAL } from './workGoal';

/** A list of IDs of tasks which cannot be suggested, unless the user has pinned them. */
const INELIGIBLE_SUGGESTED_TASKS = [
    '812adb60-d5fb-4655-8d22-d568a0dca547', // Postmortems
    '25230066-4eda-4886-a12c-39a5175ea632', // Online tactics tune up 0-1400
    'b55eda1d-11dc-4f6f-aa7b-b83a6339513f', // Online tactics tune up 1400-1800
    'b9ef52d2-795d-4005-b15a-437ee36a2c0a', // Online tactics tune up 1800+

    // Review Master Games, all cohorts
    'ec86ff17-f9ec-4ef9-aa12-60a2ace17963',
    '4e42201e-cd58-471f-9359-515e5c669b0c',
    '90d7cd05-5219-49cc-900b-efe392d28736',
    'ca281c97-f0fc-4c25-9a66-99eae875c578',
    'c3db57da-be74-4e71-b061-a16a9d80f101',
    '5b91042b-1da2-4138-99dd-c6e1732b45a9',
    'd3192026-cda6-4d1e-a1c2-1dee3f68b063',
    'fbb5ece4-f7f0-4fdd-b194-298397cb8bca',
    '89acdc78-ae38-4390-942b-8359116a9620',
    '8a68cb46-f935-4457-92d1-82ff3eafec64',
    '5d560e7c-ee48-46c8-affe-6fef6b2bf2f0',
    '539f93c8-db55-4a00-b786-962c3bdd86ac',
    '0fe8b57a-0f82-4a72-b89a-a3d56ff3b46b',
    'bdc8cbb1-b592-42f2-a1c8-896024838c05',
    '7fabaa5a-95d0-4ddc-b711-afd8fccf5aca',
    'ec27f1fe-6f9e-4be2-a869-f979eef555a5',
    '666cb454-5242-453f-83f3-d9daac487d75',
    'b2ff90b7-5900-4d33-b31b-426ee750bed4',
    'bdb1580b-421e-4501-86d9-316c77118d44',
    '8667a8d4-eafe-4855-85c2-d8580869135f',
    'b1bd988e-a856-4829-81e9-b7b2fd1ebd6d',
    'cba150ad-b66c-4fd4-b041-f35e98dcd161',
];

/** The maximum number of suggested tasks returned by the suggestion algorithm. */
const MAX_SUGGESTED_TASKS = 3;

/**
 * The categories allowed in the suggested tasks algorithm. Their order here is used
 * for breaking ties in the algorithm if two categories have the same remaining Dojo
 * point percentage.
 */
const SUGGESTED_TASK_CATEGORIES = [
    RequirementCategory.Games,
    RequirementCategory.Tactics,
    RequirementCategory.Middlegames,
    RequirementCategory.Endgame,
    RequirementCategory.Opening,
];

/** The ID of the Play Classical Games task. */
const CLASSICAL_GAMES_TASK = '38f46441-7a4e-4506-8632-166bcbe78baf';

/** The ID of the Annotate Classical Games task. */
const ANNOTATE_GAMES_TASK = '4d23d689-1284-46e6-b2a2-4b4bfdc37174';

/**
 * Returns the remaining score of a task for the purposes of the suggested task algorithm.
 * If the task is atomic, the total score of the task is considered remaining. Otherwise,
 * the actual remaining score is returned.
 */
function getRemainingSuggestionScore(
    cohort: string,
    requirement: Requirement,
    progress: RequirementProgress,
): number {
    if (requirement.atomic) {
        return getTotalScore(cohort, [requirement]);
    }
    return getRemainingScore(cohort, requirement, progress);
}

/**
 * Returns a list of tasks to be shown to the user in the Suggested Tasks category.
 * We show at most MAX_SUGGESTED_TASKS tasks, in the following priority:
 *
 *   1. The user's pinned tasks.
 *   2. If the user's number of annotated games < their number of classical games played,
 *      the annotate classical games task is suggested.
 *   3. The unique task with the greatest remaining Dojo points in the unique category
 *      with the greatest remaining percentage of Dojo points.
 *
 * Only categories in SUGGESTED_TASK_CATEGORIES are suggested (unless pinned by the user).
 * Categories are only repeated within the suggested tasks if it is not possible to
 * pick a unique category. Ties between categories are broken using the
 * SUGGESTED_TASK_CATEGORIES list.
 *
 * NOTE: some tasks (such as postmortems) are ineligible to be suggested and will not
 * be suggested unless the user has pinned them. These task IDs are listed in
 * INELIGIBLE_SUGGESTED_TASKS.
 *
 * @param pinnedTasks The user's pinned tasks.
 * @param requirements All requirements in the training plan.
 * @param user The user to suggest tasks for.
 * @returns A list of at most MAX_SUGGESTED_TASKS suggested tasks.
 */
export function getSuggestedTasks(
    pinnedTasks: (Requirement | CustomTask)[],
    requirements: Requirement[],
    user: User,
): (Requirement | CustomTask)[] {
    const suggestedTasks: (Requirement | CustomTask)[] = [];
    suggestedTasks.push(...pinnedTasks);

    if (suggestedTasks.length >= MAX_SUGGESTED_TASKS) {
        return suggestedTasks;
    }

    const isFreeUser = isFree(user);
    const eligibleRequirements = requirements.filter(
        (r) =>
            (!isFreeUser || r.isFree) &&
            !INELIGIBLE_SUGGESTED_TASKS.includes(r.id) &&
            !suggestedTasks.some((t) => r.id === t.id) &&
            SUGGESTED_TASK_CATEGORIES.includes(r.category) &&
            !isComplete(user.dojoCohort, r, user.progress[r.id]),
    );
    if (eligibleRequirements.length === 0) {
        return suggestedTasks;
    }

    const annotateTask = eligibleRequirements.find((r) => r.id === ANNOTATE_GAMES_TASK);
    const classicalGamesTask = requirements.find((r) => r.id === CLASSICAL_GAMES_TASK);
    if (
        annotateTask &&
        classicalGamesTask &&
        getCurrentCount(
            user.dojoCohort,
            annotateTask,
            user.progress[ANNOTATE_GAMES_TASK],
        ) <
            getCurrentCount(
                user.dojoCohort,
                classicalGamesTask,
                user.progress[CLASSICAL_GAMES_TASK],
            )
    ) {
        suggestedTasks.push(annotateTask);
    }

    const categoryPercentages = SUGGESTED_TASK_CATEGORIES.map((category) => ({
        category,
        percent: getRemainingCategoryScorePercent(
            user,
            user.dojoCohort,
            category,
            requirements,
        ),
    })).sort((lhs, rhs) => rhs.percent - lhs.percent);

    while (suggestedTasks.length < MAX_SUGGESTED_TASKS) {
        const eligibleCategories = categoryPercentages.filter((item) =>
            eligibleRequirements.some((r) => r.category === item.category),
        );
        if (eligibleCategories.length === 0) {
            break;
        }

        let chosenCategories = eligibleCategories.filter(
            (item) => !suggestedTasks.some((r) => r.category === item.category),
        );
        if (chosenCategories.length === 0) {
            chosenCategories = eligibleCategories;
        }

        for (const { category } of chosenCategories) {
            const categoryRequirements = eligibleRequirements
                .filter((r) => r.category === category)
                .sort(
                    (lhs, rhs) =>
                        getRemainingSuggestionScore(
                            user.dojoCohort,
                            rhs,
                            user.progress[rhs.id],
                        ) -
                        getRemainingSuggestionScore(
                            user.dojoCohort,
                            lhs,
                            user.progress[lhs.id],
                        ),
                );
            suggestedTasks.push(categoryRequirements[0]);
            eligibleRequirements.splice(
                eligibleRequirements.indexOf(categoryRequirements[0]),
                1,
            );

            if (suggestedTasks.length >= MAX_SUGGESTED_TASKS) {
                break;
            }
        }
    }

    return suggestedTasks;
}

export interface SuggestedTask {
    task: Requirement | CustomTask;
    goalMinutes: number;
}

export interface WeeklySuggestedTasks {
    /**
     * The suggested tasks of the weekly plan indexed by day of the week.
     * Sunday is index 0; Saturday is index 6.
     */
    suggestionsByDay: SuggestedTask[][];
    /** The end date of the weekly plan. */
    endDate: string;
    /**
     * The date (in ISO 8601) of the user's most recent progress update at the time this
     * weekly plan was generated.
     */
    progressUpdatedAt: string;
}

/**
 * Returns the start date, the end date and today's date for generating weekly
 * suggested tasks. All dates are set to 00:00 in the current user's local time.
 * @param weekStart The index of the day the week starts on.
 * @returns The start date, the end date and today's date.
 */
function getDates(weekStart = 0) {
    const weekEnd = (weekStart + 6) % 7;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff =
        weekEnd >= today.getDay()
            ? weekEnd - today.getDay()
            : 7 - today.getDay() + weekEnd;

    const end = new Date();
    end.setDate(end.getDate() + diff + 1);
    end.setHours(0, 0, 0, 0);

    const start = new Date(end);
    start.setDate(start.getDate() - 7);

    return { today, start, end };
}

// export function getWeeklySuggestedTasksOriginal({
//     user,
//     pinnedTasks,
//     requirements,
// }: {
//     user: User;
//     pinnedTasks: (Requirement | CustomTask)[];
//     requirements: Requirement[];
// }): WeeklySuggestedTasks {
//     const { today, start: current, end } = getDates(user.weekStart);

//     console.log('Current: ', current);
//     console.log('End: ', end);

//     const taskList: SuggestedTask[][] = new Array(7).fill(0).map(() => []);

//     const workGoal = user.workGoal || DEFAULT_WORK_GOAL;
//     const mockUser = JSON.parse(JSON.stringify(user)) as User;

//     const timePerTask: Record<string, number> = {};

//     const reuseSavedPlan =
//         user.weeklyPlan && new Date(user.weeklyPlan.endDate).getTime() >= end.getTime();

//     for (; current.getTime() < end.getTime(); current.setDate(current.getDate() + 1)) {
//         console.log('Get tasks for ', current);
//         const dayIdx = current.getDay();

//         let tasks: (Requirement | CustomTask)[];
//         if (reuseSavedPlan && user.weeklyPlan) {
//             console.log('Reusing saved weekly plan');

//             if (current.getTime() < today.getTime()) {
//                 console.log('Day is in the past, so not using new work goals');
//                 const day = user.weeklyPlan.tasks[dayIdx];
//                 for (const { id, minutes } of day) {
//                     const task =
//                         pinnedTasks.find((t) => t.id === id) ??
//                         requirements.find((t) => t.id === id);
//                     if (task) {
//                         taskList[dayIdx].push({ task, goalMinutes: minutes });
//                     }
//                 }
//                 continue;
//             }

//             tasks =
//                 user.weeklyPlan?.tasks[dayIdx]
//                     .map(
//                         (task) =>
//                             pinnedTasks.find((t) => t.id === task.id) ??
//                             requirements.find((t) => t.id === task.id),
//                     )
//                     .filter((task) => !!task) ?? [];
//         } else {
//             console.log('Generating new task list');
//             tasks = getSuggestedTasks(pinnedTasks, requirements, mockUser);
//         }

//         console.log('Tasks for dayIdx ', dayIdx, tasks);

//         const minutesToday = workGoal.minutesPerDay[dayIdx];
//         const maxTasks = Math.max(
//             1,
//             Math.floor(minutesToday / DEFAULT_WORK_GOAL.minutesPerTask),
//         );
//         const tasksWithTime = tasks.slice(0, maxTasks);

//         for (const task of tasksWithTime) {
//             let totalTaskTime =
//                 (timePerTask[task.id] ?? 0) +
//                 Math.floor(minutesToday / tasksWithTime.length);
//             updateMockProgress({ mockUser, task, time: totalTaskTime });
//             totalTaskTime %= 60;
//             timePerTask[task.id] = totalTaskTime;
//         }

//         const suggestedTasks = tasksWithTime.map((task) => ({
//             task,
//             goalMinutes: Math.floor(minutesToday / tasksWithTime.length),
//         }));
//         suggestedTasks.push(
//             ...tasks.slice(maxTasks).map((task) => ({ task, goalMinutes: 0 })),
//         );

//         taskList[dayIdx] = suggestedTasks;
//     }

//     console.log('Task List: ', taskList);
//     return { suggestionsByDay: taskList, endDate: end.toISOString() };
// }

/**
 * Returns the date in ISO 8601 of the user's most recent progress update,
 * or the empty string if the user has never updated their progress.
 * @param user The user to get the last progress update for.
 */
function lastProgressUpdate(user: User): string {
    let lastUpdate = '';
    for (const progress of Object.values(user.progress)) {
        if (progress.updatedAt > lastUpdate) {
            lastUpdate = progress.updatedAt;
        }
    }
    return lastUpdate;
}

/**
 * Returns a boolean indicating whether the given weekly plan matches the given
 * work goal. A weekly plan matches a work goal if for every day in the weekly
 * plan either there are no tasks or the total goal minutes for the day matches
 * the expected goal for the day based on the work goal settings.
 * @param weeklyPlan The weekly plan to check.
 * @param workGoal The work goal to check.
 * @returns True if the weekly plan matches the work goal.
 */
function weeklyPlanMatchesWorkGoal(
    weeklyPlan: WeeklyPlan,
    workGoal: WorkGoalSettings,
): boolean {
    for (let i = 0; i < weeklyPlan.tasks.length; i++) {
        const day = weeklyPlan.tasks[i];
        if (day.length === 0) {
            continue;
        }

        const maxTasks = Math.max(
            1,
            Math.floor(workGoal.minutesPerDay[i] / DEFAULT_WORK_GOAL.minutesPerTask),
        );
        const tasksWithTime = day.slice(0, maxTasks).length;
        const expectedTime =
            tasksWithTime * Math.floor(workGoal.minutesPerDay[i] / tasksWithTime);

        let total = 0;
        for (const { minutes } of day) {
            total += minutes;
        }

        if (total !== expectedTime) {
            return false;
        }
    }
    return true;
}

/**
 * Returns a boolean indicating whether the given weekly plan matches the given pinned tasks.
 * A weekly plan matches pinned tasks if the plan has the same task ids in the same order as
 * the given pinned tasks.
 * @param weeklyPlan The weekly plan to check.
 * @param pinnedTasks The pinned tasks to check.
 * @returns True if the weekly plan matches the pinned tasks.
 */
function weeklyPlanMatchesPinnedTasks(
    weeklyPlan: WeeklyPlan,
    pinnedTasks: (Requirement | CustomTask)[],
): boolean {
    if (!weeklyPlan.pinnedTasks?.length && !pinnedTasks.length) {
        return true;
    }
    if (weeklyPlan.pinnedTasks?.length !== pinnedTasks.length) {
        return false;
    }
    for (let i = 0; i < weeklyPlan.pinnedTasks.length; i++) {
        if (weeklyPlan.pinnedTasks[i] !== pinnedTasks[i].id) {
            return false;
        }
    }
    return true;
}

enum SuggestedTaskGenerationPrompt {
    Init,
    ProgressUpdate,
    PinnedTaskUpdate,
    WorkGoalUpdate,
}

/**
 * TODO: add documentation. Also there may be an issue with progress from today being duplicated
 * in mock user.
 * @param param0
 */
export function getWeeklySuggestedTasks({
    user,
    pinnedTasks,
    requirements,
}: {
    user: User;
    pinnedTasks: (Requirement | CustomTask)[];
    requirements: Requirement[];
}): WeeklySuggestedTasks {
    const { today, start: current, end } = getDates(user.weekStart);
    const taskList: SuggestedTask[][] = new Array(7).fill(0).map(() => []);
    const workGoal = user.workGoal || DEFAULT_WORK_GOAL;
    const mockUser = JSON.parse(JSON.stringify(user)) as User;
    const timePerTask: Record<string, number> = {};
    const progressUpdatedAt = lastProgressUpdate(user);

    let weeklyPlan = user.weeklyPlan;
    if (weeklyPlan && new Date(weeklyPlan.endDate).getTime() < end.getTime()) {
        weeklyPlan = undefined;
    }

    let prompt: SuggestedTaskGenerationPrompt;
    if (!weeklyPlan) {
        prompt = SuggestedTaskGenerationPrompt.Init;
    } else if (weeklyPlan.progressUpdatedAt !== progressUpdatedAt) {
        prompt = SuggestedTaskGenerationPrompt.ProgressUpdate;
    } else if (!weeklyPlanMatchesWorkGoal(weeklyPlan, workGoal)) {
        prompt = SuggestedTaskGenerationPrompt.WorkGoalUpdate;
    } else if (!weeklyPlanMatchesPinnedTasks(weeklyPlan, pinnedTasks)) {
        prompt = SuggestedTaskGenerationPrompt.PinnedTaskUpdate;
    } else {
        prompt = SuggestedTaskGenerationPrompt.Init;
    }

    for (; current.getTime() < end.getTime(); current.setDate(current.getDate() + 1)) {
        console.log('Get tasks for day idx %d: %s', current.getDay(), current);
        const dayIdx = current.getDay();
        let tasks: (Requirement | CustomTask)[] = [];

        if (current.getTime() < today.getTime()) {
            if (!user.weeklyPlan) {
                console.log(
                    `Day ${dayIdx} is in the past and this is user's first weekly plan, so skipping.`,
                );
                continue;
            }

            if (weeklyPlan) {
                console.log(`Day ${dayIdx} is in the past. Reusing valid plan.`);
                const day = weeklyPlan.tasks[dayIdx];
                for (const { id, minutes } of day) {
                    const task =
                        user.customTasks?.find((t) => t.id === id) ??
                        requirements.find((t) => t.id === id);
                    if (task) {
                        taskList[dayIdx].push({ task, goalMinutes: minutes });
                    }
                }
                continue;
            }
        } else if (current.getTime() === today.getTime()) {
            if (weeklyPlan && prompt !== SuggestedTaskGenerationPrompt.PinnedTaskUpdate) {
                console.log(
                    `Day ${dayIdx} is today and pinned tasks have not changed. Reusing tasks from valid plan, but minutes may change.`,
                );
                tasks =
                    user.weeklyPlan?.tasks[dayIdx]
                        .map(
                            (task) =>
                                user.customTasks?.find((t) => t.id === task.id) ??
                                requirements.find((t) => t.id === task.id),
                        )
                        .filter((task) => !!task) ?? [];
            }
        } else {
            if (weeklyPlan && prompt === SuggestedTaskGenerationPrompt.Init) {
                console.log(
                    `Day ${dayIdx} is in the future, but prompt is init, so reusing tasks from valid plan. Minutes may change.`,
                );
                tasks =
                    user.weeklyPlan?.tasks[dayIdx]
                        .map(
                            (task) =>
                                user.customTasks?.find((t) => t.id === task.id) ??
                                requirements.find((t) => t.id === task.id),
                        )
                        .filter((task) => !!task) ?? [];
            }
        }

        if (tasks.length === 0) {
            console.log(`Generating new task list for day ${dayIdx}`);
            tasks = getSuggestedTasks(pinnedTasks, requirements, mockUser);
        }

        const minutesToday = workGoal.minutesPerDay[dayIdx];
        const maxTasks = Math.max(
            1,
            Math.floor(minutesToday / DEFAULT_WORK_GOAL.minutesPerTask),
        );
        const tasksWithTime = tasks.slice(0, maxTasks);

        for (const task of tasksWithTime) {
            let totalTaskTime =
                (timePerTask[task.id] ?? 0) +
                Math.floor(minutesToday / tasksWithTime.length);
            updateMockProgress({ mockUser, task, time: totalTaskTime });
            totalTaskTime %= 60;
            timePerTask[task.id] = totalTaskTime;
        }

        const suggestedTasks = tasksWithTime.map((task) => ({
            task,
            goalMinutes: Math.floor(minutesToday / tasksWithTime.length),
        }));
        suggestedTasks.push(
            ...tasks.slice(maxTasks).map((task) => ({ task, goalMinutes: 0 })),
        );

        taskList[dayIdx] = suggestedTasks;
    }

    const result = {
        suggestionsByDay: taskList,
        endDate: end.toISOString(),
        progressUpdatedAt,
    };
    console.log('Weekly suggested tasks: ', result);
    return result;
}

function updateMockProgress({
    mockUser,
    task,
    time,
}: {
    mockUser: User;
    task: Requirement | CustomTask;
    time: number;
}) {
    if (!isRequirement(task)) {
        return;
    }

    let progress = mockUser.progress[task.id];
    if (!progress?.counts) {
        progress = {
            requirementId: task.id,
            counts: {
                [mockUser.dojoCohort]: task.startCount,
                [ALL_COHORTS]: task.startCount,
            },
            minutesSpent: { [mockUser.dojoCohort]: 0 },
            updatedAt: new Date().toISOString(),
        };
        mockUser.progress[task.id] = progress;
    }

    const points = Math.floor(time / 60);
    if (points === 0) {
        return;
    }

    let increment = 1;
    const unitScore = getUnitScore(mockUser.dojoCohort, task);
    if (unitScore > 0 && unitScore < 1) {
        increment = Math.ceil(1 / task.unitScore);
    } else if (unitScore === 0) {
        increment = getTotalCount(mockUser.dojoCohort, task);
    }
    increment *= points;

    if (progress.counts) {
        if (task.numberOfCohorts === 0 || task.numberOfCohorts === 1) {
            progress.counts[ALL_COHORTS] += increment;
        } else {
            progress.counts[mockUser.dojoCohort] += increment;
        }
    }
}
