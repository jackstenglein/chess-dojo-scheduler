import { RequirementProgress } from './requirement';
import { isObject } from './scoreboard';
import { RatingSystem } from './user';

export interface Graduation {
    username: string;
    displayName: string;
    previousCohort: string;
    newCohort: string;
    score: number;
    ratingSystem: RatingSystem;
    startRating: number;
    currentRating: number;
    comments: string;
    progress: Record<string, RequirementProgress>;
    graduationCohorts: string[];
    startedAt: string;
    createdAt: string;
}

export function isGraduation(obj: unknown): obj is Graduation {
    return isObject(obj) && obj.newCohort !== undefined;
}
