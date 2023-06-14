import { Game } from './game';
import { Position } from './requirement';

/**
 * Opening contains the full information needed to store an opening repertoire and lessons
 * across all cohort ranges.
 */
export interface Opening {
    /**
     * The primary key of the opening.
     */
    id: string;

    /**
     * The name of the opening.
     */
    name: string;

    /**
     * The color the opening is for.
     */
    color: string;

    /**
     * The list of levels associated with the opening (starter, expert, etc).
     */
    levels: OpeningLevel[];
}

/**
 * OpeningLevel contains the information needed to store an opening repertoire and lessons
 * at a single cohort range.
 */
export interface OpeningLevel {
    /**
     * The name of the opening level.
     */
    name: string;

    /**
     * The cohorts the opening level applies to.
     */
    cohorts: string[];

    /**
     * A human-readable range of the cohorts the level applies to (Ex: 1200-1800).
     */
    cohortRange: string;

    /**
     * The list of modules within the opening level.
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
     * The URLs of embedded videos, if any exist. Generally used only if
     * type is Video.
     */
    videoUrls: string[];

    /**
     * The PGN text of the module. Generally used only if type is PgnViewer.
     */
    pgn: string;

    /**
     * The positions of the module. Generally used only if type is
     * SparringPositions or Themes.
     */
    positions: Position[];

    /**
     * The games associated with the module. Generally only used if type
     * is ModelGames.
     */
    games: Game[];
}
