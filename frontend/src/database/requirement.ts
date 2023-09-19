import { User } from './user';

export enum RequirementStatus {
    Active = 'ACTIVE',
    Archived = 'ARCHIVED',
}

export enum ScoreboardDisplay {
    Unspecified = '',
    Hidden = 'HIDDEN',
    Checkbox = 'CHECKBOX',
    ProgressBar = 'PROGRESS_BAR',
    NonDojo = 'NON_DOJO',
}

export interface CustomTask {
    id: string;
    owner: string;
    name: string;
    description: string;
    counts: {
        [cohort: string]: number;
    };
    scoreboardDisplay: ScoreboardDisplay;
    category: string;
    updatedAt: string;
    isFree?: boolean;
}

export interface Position {
    title: string;
    fen: string;
    limitSeconds: number;
    incrementSeconds: number;
    result: string;
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
    startCount: number;
    numberOfCohorts: number;
    unitScore: number;
    unitScoreOverride?: {
        [cohort: string]: number;
    };
    totalScore: number;
    videoUrls?: string[];
    positions?: Position[];
    scoreboardDisplay: ScoreboardDisplay;
    progressBarSuffix: string;
    updatedAt: string;
    sortPriority: string;
    expirationDays: number;
    isFree: boolean;
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
    owner: string;
    id: string;
    requirementId: string;
    requirementName: string;
    requirementCategory: string;
    cohort: string;
    totalCount: number;
    previousCount: number;
    newCount: number;
    minutesSpent: number;
    scoreboardDisplay: ScoreboardDisplay;
    progressBarSuffix: string;
    createdAt: string;
}

export function isRequirement(obj: any): obj is Requirement {
    return obj.numberOfCohorts !== undefined;
}

export function compareRequirements(a: Requirement, b: Requirement) {
    if (a.sortPriority === undefined || b.sortPriority === undefined) {
        return 0;
    }
    return a.sortPriority.localeCompare(b.sortPriority);
}

export function getCurrentCount(
    cohort: string,
    requirement: Requirement | CustomTask,
    progress?: RequirementProgress
): number {
    if (!progress) {
        return 0;
    }
    if (!isRequirement(requirement)) {
        return 0;
    }
    if (requirement.scoreboardDisplay === ScoreboardDisplay.NonDojo) {
        return 0;
    }

    if (isExpired(requirement, progress)) {
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

export function getTotalTime(cohort: string, progress?: RequirementProgress): number {
    if (!progress) {
        return 0;
    }
    return progress.minutesSpent[cohort] || 0;
}

export function formatTime(value: number): string {
    const hours = Math.floor(value / 60);
    const minutes = Math.round(value % 60);
    if (minutes === 0 && hours > 0) {
        return `${hours}h`;
    }
    return `${hours}h ${minutes}m`;
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

export function isExpired(
    requirement: Requirement,
    progress?: RequirementProgress
): boolean {
    if (!progress) {
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

export function getCurrentScore(
    cohort: string,
    requirement: Requirement,
    progress?: RequirementProgress
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

    let unitScore = requirement.unitScore;
    if (
        requirement.unitScoreOverride &&
        requirement.unitScoreOverride[cohort] !== undefined
    ) {
        unitScore = requirement.unitScoreOverride[cohort];
    }
    const currentCount = getCurrentCount(cohort, requirement, progress);
    return Math.max(currentCount - requirement.startCount, 0) * unitScore;
}

export function getTotalScore(cohort: string | undefined, requirements: Requirement[]) {
    if (!cohort) {
        return 0;
    }

    const totalScore = requirements.reduce((sum, r) => {
        if (r.totalScore) {
            return sum + r.totalScore;
        }
        let unitScore = r.unitScore;
        if (r.unitScoreOverride && r.unitScoreOverride[cohort] !== undefined) {
            unitScore = r.unitScoreOverride[cohort];
        }
        const count = r.counts[cohort] || 0;
        return sum + (count - r.startCount) * unitScore;
    }, 0);

    return totalScore;
}

export function getCohortScore(
    user: User,
    cohort: string | undefined,
    requirements: Requirement[]
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

export function getCategoryScore(
    user: User,
    cohort: string | undefined,
    category: string,
    requirements: Requirement[]
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

export function getTotalCategoryScore(
    cohort: string | undefined,
    category: string,
    requirements: Requirement[]
) {
    if (!cohort) {
        return 0;
    }

    return getTotalScore(
        cohort,
        requirements.filter((r) => r.category === category)
    );
}

export function getUnitScore(cohort: string, requirement: Requirement): number {
    let unitScore = requirement.unitScore;
    if (
        requirement.unitScoreOverride &&
        requirement.unitScoreOverride[cohort] !== undefined
    ) {
        unitScore = requirement.unitScoreOverride[cohort];
    }
    return unitScore;
}
