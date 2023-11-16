import { Position } from './requirement';

export enum CourseType {
    Opening = 'OPENING',
    Other = 'OTHER',
}

/**
 * Course contains the full information for a course. A course is
 * defined as a series of related chapters designed for a specific cohort range.
 */
export interface Course {
    /** The type of the course. */
    type: CourseType;

    /**
     * The id of the course.
     */
    id: string;

    /**
     * The name of the course.
     */
    name: string;

    /** The description of the course. */
    description: string;

    /** Bullet points describing what's included in the course. */
    whatsIncluded?: string[];

    /**
     * The color the course is designed for.
     */
    color: string;

    /**
     * The cohorts the course is designed for.
     */
    cohorts: string[];

    /**
     * A human-readable range of the cohorts the course applies to (Ex: 1200-1800).
     */
    cohortRange: string;

    /**
     * The price of the course in cents. A non-positive number indicates that the course is
     * not for sale separately from the training plan.
     */
    price: number;

    /**
     * Whether the course is included with a training-plan subscription.
     */
    includedWithSubscription: boolean;

    /** Whether the course is available for free-tier users. */
    availableForFreeUsers: boolean;

    /** The buy button id on Stripe. */
    stripeBuyButtonId: string;

    /**
     * The list of chapters included in the course.
     */
    chapters?: Chapter[];
}

/**
 * Chapter contains the information for a single course chapter.
 */
export interface Chapter {
    /**
     * The name of the chapter.
     */
    name: string;

    /**
     * The FEN to display as the thumbnail of the chapter.
     */
    thumbnailFen: string;

    /**
     * The board orientation of the thumbnail.
     */
    thumbnailOrientation: 'white' | 'black';

    /**
     * The list of modules within the chapter.
     */
    modules: CourseModule[];
}

/**
 * The possible types of an CourseModule.
 */
export enum CourseModuleType {
    Video = 'VIDEO',
    PgnViewer = 'PGN_VIEWER',
    SparringPositions = 'SPARRING_POSITIONS',
    ModelGames = 'MODEL_GAMES',
    Themes = 'THEMES',
    Exercises = 'EXERCISES',
}

export enum Coach {
    Jesse = 'JESSE',
    Kostya = 'KOSTYA',
    David = 'DAVID',
}

export const coachUrls = {
    [Coach.Jesse]: 'https://chess-dojo-images.s3.amazonaws.com/icons/jesse.png',
    [Coach.Kostya]: 'https://chess-dojo-images.s3.amazonaws.com/icons/kostya.png',
    [Coach.David]: 'https://chess-dojo-images.s3.amazonaws.com/icons/david.png',
};

export const coaches = [Coach.Jesse, Coach.Kostya, Coach.David];

/**
 * A single section within a course.
 */
export interface CourseModule {
    /**
     * The optional id of the module. Used mainly for exercises to persist progress
     * on the exercises.
     */
    id: string;

    /**
     * The name of the module.
     */
    name: string;

    /**
     * The type of the module.
     */
    type: CourseModuleType;

    /**
     * The description of the module.
     */
    description: string;

    /**
     * A body of text that appears after the main content of the module.
     */
    postscript: string;

    /**
     * The URLs of embedded videos, if any exist. Generally used only if
     * type is Video.
     */
    videoUrls: string[];

    /**
     * A list of PGNs for the module. Generally used only if type is PgnViewer, ModelGames or Exercises.
     */
    pgns: string[];

    /**
     * The coach to use for Exercises.
     */
    coach: string;

    /**
     * The positions of the module. Generally used only if type is
     * SparringPositions or Themes.
     */
    positions: Position[];

    /**
     * The default board orientation for the module.
     */
    boardOrientation: 'white' | 'black';
}
