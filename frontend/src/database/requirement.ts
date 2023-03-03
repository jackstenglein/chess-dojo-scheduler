export enum RequirementStatus {
    Active = 'ACTIVE',
    Archived = 'ARCHIVED',
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
    hideFromScoreboard: boolean;
    updatedAt: string;
    sortPriority: string;
}

export function compareRequirements(a: Requirement, b: Requirement) {
    if (a.sortPriority === undefined || b.sortPriority === undefined) {
        return 0;
    }
    return a.sortPriority.localeCompare(b.sortPriority);
}
