import { DEFAULT_WORK_GOAL } from '@/components/profile/trainingPlan/workGoal';
import { isObject } from './scoreboard';
import { ALL_COHORTS, isFree, SubscriptionStatus, User } from './user';

/** The status of a requirement. */
export enum RequirementStatus {
    /** The requirement is actively in use. */
    Active = 'ACTIVE',

    /**
     * The requirement is no longer in use. Currently this status is not actually used.
     * We instead have just deleted old requirements.
     */
    Archived = 'ARCHIVED',
}

/** Defines how the requirement is displayed on the scoreboard. */
export enum ScoreboardDisplay {
    Unspecified = '',

    /** The requirement is not displayed on the scoreboard. */
    Hidden = 'HIDDEN',

    /** The requirement is displayed as a checkbox. */
    Checkbox = 'CHECKBOX',

    /** The requirement is displayed as a progress bar. */
    ProgressBar = 'PROGRESS_BAR',

    /** The requirement is a set amount of time. */
    Minutes = 'MINUTES',

    /** The requirement is a non-dojo task. */
    NonDojo = 'NON_DOJO',
}

/** A custom non-dojo task created by a user. */
export interface CustomTask {
    /** The id of the CustomTask. */
    id: string;

    /** The username of the owner of the CustomTask. */
    owner: string;

    /** The name of the CustomTask. */
    name: string;

    /**
     * Does not exist for CustomTasks, but makes the type system happy when
     * working with both Requirements and CustomTasks.
     */
    dailyName?: undefined;

    /** The description of the CustomTask. */
    description: string;

    /**
     * The target count of the CustomTask per cohort. Currently defaults to the value 1 for
     * each selected cohort that the task applies to.
     */
    counts: Record<string, number>;

    /** The scoreboard display of the CustomTask. */
    scoreboardDisplay: ScoreboardDisplay;

    /** The category of the CustomTask. */
    category: CustomTaskCategory;

    /**
     * The number of cohorts the requirement needs to be completed in before it
     * stops being suggested. For requirements that restart their progress in every
     * cohort, this is the special value -1.
     */
    numberOfCohorts: number;

    /** An optional string that is used to label the count of the progress bar. */
    progressBarSuffix: string;

    /** The last time the CustomTask definition was updated. */
    updatedAt: string;

    /**
     * Does not exist for CustomTasks, but including this makes it easier to
     * perform operations on objects of type Requirement|CustomTask.
     */
    startCount?: number;
}

/** A position in a requirement. */
export interface Position {
    /** The title of the position. */
    title: string;

    /** The FEN of the position. */
    fen: string;

    /** The time limit in seconds that the position should be played at. */
    limitSeconds: number;

    /** The increment in seconds that the position should be played at. */
    incrementSeconds: number;

    /** The expected result of the position. */
    result: string;
}

/** The categories of a requirement. */
export enum RequirementCategory {
    Welcome = 'Welcome to the Dojo',
    Games = 'Games + Analysis',
    Tactics = 'Tactics',
    Middlegames = 'Middlegames + Strategy',
    Endgame = 'Endgame',
    Opening = 'Opening',
    Graduation = 'Graduation',
    NonDojo = 'Non-Dojo',
    SuggestedTasks = 'Suggested Tasks',
    Pinned = 'Pinned Tasks',
}

/** The categories of a custom task. This is a subset of RequirementCategory. */
export type CustomTaskCategory = Extract<
    RequirementCategory,
    | RequirementCategory.Games
    | RequirementCategory.Tactics
    | RequirementCategory.Middlegames
    | RequirementCategory.Endgame
    | RequirementCategory.Opening
>;

/**
 * Returns true if obj is of type CustomTaskCategory.
 */
export function isCustomTaskCategory(obj: unknown): obj is CustomTaskCategory {
    return (
        typeof obj === 'string' &&
        (obj === RequirementCategory.Games ||
            obj === RequirementCategory.Tactics ||
            obj === RequirementCategory.Middlegames ||
            obj === RequirementCategory.Endgame ||
            obj === RequirementCategory.Opening)
    );
}

/** A requirement in the training plan. */
export interface Requirement {
    /** The id of the requirement. */
    id: string;

    /** The status of the requirement. */
    status: RequirementStatus;

    /** The category of the requirement. */
    category: RequirementCategory;

    /** The name of the requirement. */
    name: string;

    /**
     * An optional short name for the requirement, which is displayed in certain contexts
     * like the pie charts.
     */
    shortName?: string;

    /**
     * The optional daily name for the requirement, which is displayed in contexts
     * like the training plan daily tab.
     */
    dailyName?: string;

    /** The description of the requirement. */
    description: string;

    /** The description of the requirement for free-tier users. */
    freeDescription: string;

    /**
     * A map from the cohort to the target count necessary to complete the
     * requirement. For requirements that carry progress over across cohorts,
     * the special value ALL_COHORTS is used as a key.
     */
    counts: Record<string, number>;

    /**
     * The starting count of the requirement, if it doesn't start at 0. For
     * example, the Polgar M2s start at 306.
     */
    startCount: number;

    /**
     * The number of cohorts the requirement needs to be completed in before it
     * stops being suggested. For requirements that restart their progress in every
     * cohort, this is the special value -1.
     */
    numberOfCohorts: number;

    /** The amount of dojo points awarded for each unit of the requirement completed. */
    unitScore: number;

    /** An optional map from the cohort to an override of the unitScore value. */
    unitScoreOverride?: Record<string, number>;

    /**
     * An optional amount of dojo points that is applied only when the requirement is
     * fully complete. If present, this overrides the unit score and no dojo
     * points are awarded until this value is applied.
     */
    totalScore: number;

    /** A list of video embed URLs associated with the requirement. */
    videoUrls?: string[];

    /** A list of positions associated with the requirement. */
    positions?: Position[];

    /** The scoreboard display of the requirement. */
    scoreboardDisplay: ScoreboardDisplay;

    /** An optional string that is used to label the count of the progress bar. */
    progressBarSuffix: string;

    /** The last time the requirement was updated. */
    updatedAt: string;

    /** A string which is used to sort the requirement relative to other requirements. */
    sortPriority: string;

    /** The number of days before progress on the requirement expires. */
    expirationDays: number;

    /** Whether the requirement is visible to free-tier users. */
    isFree: boolean;

    /**
     * A list of requirement IDs which must be completed before this requirement
     * can be updated.
     */
    blockers?: string[];

    /**
     * Indicates whether the task must be fully complete before the suggested
     * task algorithm skips over it.
     */
    atomic: boolean;
}

/** A user's progress on a specific requirement. */
export interface RequirementProgress {
    /** The id of the requirement. */
    requirementId: string;

    /**
     * A map from the cohort to the user's current count in the requirement. For
     * requirements whose progress carries over across cohorts, the special value
     * ALL_COHORTS is used as a key.
     */
    counts?: Record<string, number>;

    /** A map from the cohort to the user's time spent on the requirement in that cohort. */
    minutesSpent: Record<string, number>;

    /** The time the user last updated their progress on the requirement. */
    updatedAt: string;
}

/**
 * Returns whether obj is a Requirement.
 * @param obj The object to check
 * @returns Whether obj is a Requirement.
 */
export function isRequirement(obj: unknown): obj is Requirement {
    return isObject(obj) && obj.sortPriority !== undefined;
}

/**
 * A function which can be used to sort Requirements.
 * @param a The first Requirement to compare.
 * @param b The second Requirement to compare.
 * @returns A number which indicates whether a comes before, after or is equal to b.
 */
export function compareRequirements(a: Requirement, b: Requirement) {
    if (a.sortPriority === undefined || b.sortPriority === undefined) {
        return 0;
    }
    return a.sortPriority.localeCompare(b.sortPriority);
}

/**
 * Optionally clamps the provided count to the range prescribed by the requirement.
 * @param cohort The cohort to use when getting the count.
 * @param requirement The requirement to get the count for.
 * @param count The count to clamp.
 * @param clamp Whether to clamp. If false, count is returned unchanged.
 * @returns The clamped count.
 */
function clampCount(
    cohort: string,
    requirement: Requirement | CustomTask,
    count: number,
    clamp?: boolean,
): number {
    if (clamp) {
        return Math.max(
            Math.min(count, requirement.counts[cohort] || 0),
            requirement.startCount || 0,
        );
    }
    return count;
}

/**
 * Gets the current count of a user's progress in a given requirement, optionally
 * clamping to the requirement's range.
 * @param cohort The cohort to get the count for.
 * @param requirement The requirement or custom task to get the count for.
 * @param progress The user's progress in the requirement.
 * @param clamp Whether to clamp the count.
 * @returns The user's current count on the requirement.
 */
export function getCurrentCount(
    cohort: string,
    requirement: Requirement | CustomTask,
    progress?: RequirementProgress,
    clamp?: boolean,
): number {
    if (!progress) {
        return 0;
    }
    if (
        isRequirement(requirement) &&
        requirement.scoreboardDisplay === ScoreboardDisplay.NonDojo
    ) {
        return 0;
    }

    if (isExpired(requirement, progress)) {
        return 0;
    }

    if (requirement.numberOfCohorts === 1 || requirement.numberOfCohorts === 0) {
        return clampCount(cohort, requirement, progress.counts?.ALL_COHORTS || 0, clamp);
    }

    if (
        requirement.numberOfCohorts > 1 &&
        Object.keys(progress.counts || {}).length >= requirement.numberOfCohorts
    ) {
        if (progress.counts?.[cohort] !== undefined) {
            return clampCount(cohort, requirement, progress.counts[cohort], clamp);
        }

        return clampCount(
            cohort,
            requirement,
            Math.max(...Object.values(progress.counts || {})),
            clamp,
        );
    }

    if (requirement.counts?.[cohort] === undefined) {
        cohort = Object.keys(requirement.counts)[0];
    }
    return clampCount(cohort, requirement, progress.counts?.[cohort] || 0, clamp);
}

/**
 * Returns the total count for the given cohort and requirement.
 * @param cohort The cohort to get the total count for.
 * @param requirement The requirement to get the total count for.
 * @returns The total count for the given cohort and requirement.
 */
export function getTotalCount(
    cohort: string,
    requirement: Requirement | CustomTask,
): number {
    return requirement.counts[cohort] || 0;
}

/**
 * Returns the total time spent in the given cohort for the requirement progress.
 * @param cohort The cohort to get the time for.
 * @param progress The requirement progress to get the time for.
 * @returns
 */
export function getTotalTime(cohort: string, progress?: RequirementProgress): number {
    if (!progress) {
        return 0;
    }
    return progress.minutesSpent[cohort] || 0;
}

/**
 * Converts the given number of minutes to a user-facing display string.
 * @param value The number of minutes to display.
 * @returns The user-facing display string.
 */
export function formatTime(value: number): string {
    const hours = Math.floor(value / 60);
    const minutes = Math.round(value % 60);
    if (hours === 0) {
        return `${minutes}m`;
    }
    if (minutes === 0) {
        return `${hours}h`;
    }
    return `${hours}h ${minutes}m`;
}

/**
 * Returns true if the given requirement progress indicates the user has
 * completed the requirement in the given cohort.
 * @param cohort The cohort to check.
 * @param requirement The requirement to check.
 * @param progress The progress to check.
 * @returns True if the requirement is complete.
 */
export function isComplete(
    cohort: string,
    requirement: Requirement | CustomTask,
    progress?: RequirementProgress,
): boolean {
    if (requirement.scoreboardDisplay === ScoreboardDisplay.NonDojo) {
        return false;
    }
    return (
        getCurrentCount(cohort, requirement, progress) >=
        getTotalCount(cohort, requirement)
    );
}

/**
 * Returns true if the given progress is expired for the given requirement.
 * @param requirement The requirement to check.
 * @param progress The progress to check.
 * @returns True if the progress is expired.
 */
export function isExpired(
    requirement: Requirement | CustomTask,
    progress?: RequirementProgress,
): boolean {
    if (!progress) {
        return false;
    }

    if (!isRequirement(requirement)) {
        return false;
    }

    if (requirement.expirationDays > 0) {
        const expirationDate = new Date(progress.updatedAt);
        expirationDate.setDate(expirationDate.getDate() + requirement.expirationDays);

        if (new Date().getTime() > expirationDate.getTime()) {
            return true;
        }
    }
    return false;
}

/**
 * Returns the current dojo points value of the given progress.
 * @param cohort The cohort to get the dojo points for.
 * @param requirement The requirement to get the dojo points for.
 * @param progress The progress to get the dojo points for.
 * @returns The current dojo points of the given progress.
 */
export function getCurrentScore(
    cohort: string,
    requirement: Requirement,
    progress?: RequirementProgress,
) {
    if (!progress) {
        return 0;
    }

    if (requirement.totalScore) {
        if (isComplete(cohort, requirement, progress)) {
            return requirement.totalScore;
        }
        return 0;
    }

    const unitScore = getUnitScore(cohort, requirement);
    const currentCount = getCurrentCount(cohort, requirement, progress, true);
    return Math.max(currentCount - requirement.startCount, 0) * unitScore;
}

/**
 * Returns the total possible dojo points for the given cohort and set of requirements.
 * @param cohort The cohort to get the total possible points for.
 * @param requirements The set of requirements to get the total possible points for.
 * @returns The total possible dojo points for the cohort and requirements.
 */
export function getTotalScore(cohort: string | undefined, requirements: Requirement[]) {
    if (!cohort) {
        return 0;
    }

    const totalScore = requirements.reduce((sum, r) => {
        if (r.totalScore) {
            return sum + r.totalScore;
        }
        let unitScore = r.unitScore;
        if (r.unitScoreOverride?.[cohort] !== undefined) {
            unitScore = r.unitScoreOverride[cohort];
        }
        const count = r.counts[cohort] || 0;
        return sum + (count - r.startCount) * unitScore;
    }, 0);

    return totalScore;
}

/**
 * Returns the Dojo points remaining uncompleted in the requirement.
 * @param cohort The cohort to get the points for.
 * @param requirement The requirement to get the points for.
 * @param progress The progress to get the points for.
 */
export function getRemainingScore(
    cohort: string,
    requirement: Requirement,
    progress?: RequirementProgress,
): number {
    const total = getTotalScore(cohort, [requirement]);
    const current = getCurrentScore(cohort, requirement, progress);
    return total - current;
}

/**
 * Returns the user's dojo points for the given cohort and set of requirements.
 * @param user The user to get the dojo points for.
 * @param cohort The cohort to get the dojo points for.
 * @param requirements The requirements to get the dojo points for.
 * @returns The user's dojo points for the given cohort and requirements.
 */
export function getCohortScore(
    user: User,
    cohort: string | undefined,
    requirements: Requirement[],
): number {
    if (!cohort) {
        return 0;
    }

    let score = 0;
    for (const requirement of requirements) {
        score += getCurrentScore(cohort, requirement, user.progress[requirement.id]);
    }
    return Math.round(score * 100) / 100;
}

/**
 * Returns the dojo score for the given user, cohort, requirement category and requirements.
 * @param user The user to get the score for.
 * @param cohort The cohort to get the score for.
 * @param category The requirement category to get the score for.
 * @param requirements The set of requirements to get the score for.
 * @returns The dojo score for the given parameters.
 */
export function getCategoryScore(
    user: User,
    cohort: string | undefined,
    category: string,
    requirements: Requirement[],
): number {
    if (!cohort) {
        return 0;
    }

    let score = 0;
    for (const requirement of requirements) {
        if (requirement.category === category) {
            score += getCurrentScore(cohort, requirement, user.progress[requirement.id]);
        }
    }
    return Math.round(score * 100) / 100;
}

/**
 * Returns the total possible dojo score for the given cohort, requirement category and requirements.
 * @param cohort The cohort to get the score for.
 * @param category The requirement category to get the score for.
 * @param requirements The set of requirements to get the score for.
 * @returns The total possible dojo score for the given parameters.
 */
export function getTotalCategoryScore(
    cohort: string | undefined,
    category: string,
    requirements: Requirement[],
) {
    if (!cohort) {
        return 0;
    }

    return getTotalScore(
        cohort,
        requirements.filter((r) => r.category === category),
    );
}

/**
 * Returns the percentage of Dojo points remaining uncompleted in the category.
 * @param user The user to get the Dojo points for.
 * @param cohort The cohort to get the Dojo points for.
 * @param category The category to get the Dojo points for.
 * @param requirements The list of requirements to get the Dojo points for.
 */
export function getRemainingCategoryScorePercent(
    user: User,
    cohort: string,
    category: string,
    requirements: Requirement[],
): number {
    const total = getTotalCategoryScore(cohort, category, requirements);
    const score = getCategoryScore(user, cohort, category, requirements);
    return (total - score) / total;
}

/**
 * Returns the unit score of the requirement for the given cohort.
 * @param cohort The cohort to get the unit score for.
 * @param requirement The requirement to get the unit score for.
 * @returns The unit score of the requirement for the given cohort.
 */
export function getUnitScore(cohort: string, requirement: Requirement): number {
    if (requirement.unitScoreOverride?.[cohort] !== undefined) {
        return requirement.unitScoreOverride[cohort];
    }
    return requirement.unitScore;
}

/**
 * Returns whether the given requirement is currently blocked for the given user/cohort.
 * @param cohort The cohort to check.
 * @param user The user to check.
 * @param requirement The requirement to check.
 * @param requirements The list of all requirements which could be blockers.
 * @returns An object containing a boolean field and a user-facing reason if blocked.
 */
export function isBlocked(
    cohort: string,
    user: User,
    requirement: Requirement | CustomTask,
    requirements: Requirement[],
): { isBlocked: boolean; reason?: string } {
    if (!isRequirement(requirement)) {
        return { isBlocked: false };
    }

    if (!requirement.blockers || requirement.blockers.length === 0) {
        return { isBlocked: false };
    }

    const requirementMap = requirements.reduce<Record<string, Requirement>>((acc, r) => {
        acc[r.id] = r;
        return acc;
    }, {});

    const isFreeTier = user.subscriptionStatus !== SubscriptionStatus.Subscribed;

    for (const blockerId of requirement.blockers) {
        const blocker = requirementMap[blockerId];
        if (
            blocker &&
            (blocker.isFree || !isFreeTier) &&
            !isComplete(cohort, blocker, user.progress[blockerId])
        ) {
            return {
                isBlocked: true,
                reason: `This task is locked until you complete ${blocker.category} - ${blocker.name}.`,
            };
        }
    }
    return { isBlocked: false };
}

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

export function getWeeklySuggestedTasks({
    user,
    pinnedTasks,
    requirements,
}: {
    user: User;
    pinnedTasks: (Requirement | CustomTask)[];
    requirements: Requirement[];
}): { suggestionsByDay: SuggestedTask[][]; endDate: string } {
    const weekStart = user.weekStart || 0;
    const weekEnd = (weekStart + 6) % 7;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff =
        weekEnd >= now.getDay() ? weekEnd - now.getDay() : 7 - now.getDay() + weekEnd;

    const end = new Date();
    end.setDate(end.getDate() + diff + 1);
    end.setHours(0, 0, 0, 0);

    const current = new Date(end);
    current.setDate(current.getDate() - 7);

    console.log('Current: ', current);
    console.log('End: ', end);

    const taskList: SuggestedTask[][] = new Array(7).fill(0).map(() => []);

    const workGoal = user.workGoal || DEFAULT_WORK_GOAL;
    const mockUser = JSON.parse(JSON.stringify(user)) as User;

    const timePerTask: Record<string, number> = {};

    const reuseSavedPlan =
        user.weeklyPlan && new Date(user.weeklyPlan.endDate).getTime() >= end.getTime();

    for (; current.getTime() < end.getTime(); current.setDate(current.getDate() + 1)) {
        console.log('Get tasks for ', current);
        const dayIdx = current.getDay();

        let tasks: (Requirement | CustomTask)[];
        if (reuseSavedPlan && user.weeklyPlan) {
            console.log('Reusing saved weekly plan');

            if (current.getTime() < now.getTime()) {
                console.log('Day is in the past, so not using new work goals');
                const day = user.weeklyPlan.tasks[dayIdx];
                for (const { id, minutes } of day) {
                    const task =
                        pinnedTasks.find((t) => t.id === id) ??
                        requirements.find((t) => t.id === id);
                    if (task) {
                        taskList[dayIdx].push({ task, goalMinutes: minutes });
                    }
                }
                continue;
            }

            tasks =
                user.weeklyPlan?.tasks[dayIdx]
                    .map(
                        (task) =>
                            pinnedTasks.find((t) => t.id === task.id) ??
                            requirements.find((t) => t.id === task.id),
                    )
                    .filter((task) => !!task) ?? [];
        } else {
            console.log('Generating new task list');
            tasks = getSuggestedTasks(pinnedTasks, requirements, mockUser);
        }

        console.log('Tasks for dayIdx ', dayIdx, tasks);

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

    console.log('Task List: ', taskList);
    return { suggestionsByDay: taskList, endDate: end.toISOString() };
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
