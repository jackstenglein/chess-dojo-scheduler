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
    unitScore: number;
    videoUrls: string[];
    positions: string[];
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

export function compareRequirements(a: Requirement, b: Requirement) {
    if (a.sortPriority === undefined || b.sortPriority === undefined) {
        return 0;
    }
    return a.sortPriority.localeCompare(b.sortPriority);
}
