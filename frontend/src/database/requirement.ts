export enum RequirementStatus {
    Active = 'ACTIVE',
    Archived = 'ARCHIVED',
}

export enum ScoreboardDisplay {
    Unspecified = '',
    Hidden = 'HIDDEN',
    Checkbox = 'CHECKBOX',
    ProgressBar = 'PROGRESS_BAR',
}

export interface Requirement {
    id: string;
    status: RequirementStatus;
    category: string;
    name: string;
    description: string;
    counts: {
        [cohort: string]: number;
    };
    numberOfCohorts: number;
    unitScore: number;
    videoUrls: string[];
    positionUrls?: string[];
    scoreboardDisplay: ScoreboardDisplay;
    updatedAt: string;
    sortPriority: string;
}

export interface RequirementProgress {
    requirementId: string;
    counts: {
        [cohort: string]: number;
    };
    minutesSpent: {
        [cohort: string]: number;
    };
    updatedAt: string;
}

export interface TimelineEntry {
    requirementId: string;
    requirementName: string;
    requirementCategory: string;
    cohort: string;
    totalCount: number;
    previousCount: number;
    newCount: number;
    minutesSpent: number;
    scoreboardDisplay: ScoreboardDisplay;
    createdAt: string;
}

export function compareRequirements(a: Requirement, b: Requirement) {
    if (a.sortPriority === undefined || b.sortPriority === undefined) {
        return 0;
    }
    return a.sortPriority.localeCompare(b.sortPriority);
}

export function getCurrentCount(
    cohort: string,
    requirement: Requirement,
    progress?: RequirementProgress
): number {
    if (!progress) {
        return 0;
    }

    if (requirement.numberOfCohorts === 1 || requirement.numberOfCohorts === 0) {
        return progress.counts.ALL_COHORTS || 0;
    }

    if (
        requirement.numberOfCohorts > 1 &&
        Object.keys(progress.counts).length >= requirement.numberOfCohorts
    ) {
        return Math.max(...Object.values(progress.counts));
    }

    if (!requirement.counts[cohort]) {
        cohort = Object.keys(requirement.counts)[0];
    }
    return progress.counts[cohort] || 0;
}

export function getTotalCount(cohort: string, requirement: Requirement): number {
    return requirement.counts[cohort] || 0;
}

export function isComplete(
    cohort: string,
    requirement: Requirement,
    progress?: RequirementProgress
): boolean {
    return (
        getCurrentCount(cohort, requirement, progress) >=
        getTotalCount(cohort, requirement)
    );
}

export function getCurrentScore(
    cohort: string,
    requirement: Requirement,
    progress?: RequirementProgress
) {
    if (!progress) {
        return 0;
    }
    const currentCount = getCurrentCount(cohort, requirement, progress);
    return currentCount * requirement.unitScore;
}
