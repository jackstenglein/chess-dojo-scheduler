import { Position } from './requirement';

/**
 * Course contains the full information for an opening course. An opening course is
 * defined as a series of related chapters designed for a specific cohort range.
 */
export interface Course {
    /**
     * The primary key of the course.
     */
    id: string;

    /**
     * The name of the course.
     */
    name: string;

    /**
     * The color the opening course is designed for.
     */
    color: string;

    /**
     * The cohorts the opening course is designed for.
     */
    cohorts: string[];

    /**
     * A human-readable range of the cohorts the course applies to (Ex: 1200-1800).
     */
    cohortRange: string;

    /**
     * The list of chapters included in the opening course.
     */
    chapters: Chapter[];
}

/**
 * Chapter contains the information for a single opening chapter.
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
    modules: OpeningModule[];
}

/**
 * The possible types of an OpeningModule.
 */
export enum OpeningModuleType {
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

/**
 * OpeningModule is a single section within an opening.
 */
export interface OpeningModule {
    /**
     * The name of the opening module.
     */
    name: string;

    /**
     * The type of the opening module.
     */
    type: OpeningModuleType;

    /**
     * The description of the opening module.
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
