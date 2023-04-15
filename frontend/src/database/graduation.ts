import { RequirementProgress } from './requirement';
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
    progress: {
        [id: string]: RequirementProgress;
    };
    startedAt: string;
    createdAt: string;
}

export function isGraduation(obj: any): obj is Graduation {
    return obj.newCohort !== undefined;
}
