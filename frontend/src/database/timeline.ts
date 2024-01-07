import { Comment } from './game';
import { ScoreboardDisplay } from './requirement';

export interface TimelineEntry {
    owner: string;
    ownerDisplayName: string;
    id: string;
    requirementId: string;
    requirementName: string;
    requirementCategory: string;
    cohort: string;
    totalCount: number;
    previousCount: number;
    newCount: number;
    dojoPoints: number;
    totalDojoPoints: number;
    minutesSpent: number;
    totalMinutesSpent: number;
    scoreboardDisplay: ScoreboardDisplay;
    progressBarSuffix: string;
    date?: string;
    createdAt: string;

    graduationInfo?: TimelineGraduationInfo;
    gameInfo?: TimelineGameInfo;

    notes: string;
    comments: Comment[] | null;
    reactions: Record<string, Reaction> | null;
}

export interface TimelineGraduationInfo {
    comments: string;
    dojoScore: number;
    newCohort: string;
    dojoMinutes: number;
    nonDojoMinutes: number;
}

export interface TimelineGameInfo {
    id: string;
    headers: Record<string, string>;
}

export interface Reaction {
    username: string;
    displayName: string;
    cohort: string;
    updatedAt: string;
    types?: string[];
}
