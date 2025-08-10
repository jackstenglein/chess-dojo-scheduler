/** A user's progress on a specific requirement. */
export interface RequirementProgress {
    /** The id of the requirement. */
    requirementId: string;

    /**
     * A map from the cohort to the user's current count in the requirement. For
     * requirements whose progress carries over across cohorts, the special value
     * ALL_COHORTS is used as a key.
     */
    counts: Record<string, number>;

    /** A map from the cohort to the user's time spent on the requirement in that cohort. */
    minutesSpent: Record<string, number>;

    /** The time the user last updated their progress on the requirement. */
    updatedAt: string;
}

/** A custom non-dojo task created by a user. */
export interface CustomTask {
    /** The id of the CustomTask. */
    id: string;

    /** The username of the owner of the CustomTask. */
    owner: string;

    /** The name of the CustomTask. */
    name: string;

    /** The description of the CustomTask. */
    description: string;

    /**
     * The target count of the CustomTask per cohort. Currently defaults to the value 1 for
     * each selected cohort that the task applies to.
     */
    counts: Record<string, number>;

    /** The scoreboard display of the CustomTask. Should always be non-dojo. */
    scoreboardDisplay: ScoreboardDisplay.NonDojo;

    /** The category of the CustomTask. Should always be non-dojo. */
    category: RequirementCategory.NonDojo;

    /** The last time the CustomTask definition was updated. */
    updatedAt: string;

    /** Whether the CustomTask applies to the free tier. */
    isFree?: boolean;
}

/** Defines how the requirement is displayed on the scoreboard. */
export enum ScoreboardDisplay {
    Unspecified = '',

    /** The requirement is not displayed on the scoreboard. */
    Hidden = 'HIDDEN',

    /** The requirement is displayed as a checkbox. */
    Checkbox = 'CHECKBOX',

    /** The requirement is displayed as a progress bar. */
    ProgressBar = 'PROGRESS_BAR',

    /** The requirement is a set amount of time. */
    Minutes = 'MINUTES',

    /** The requirement is a non-dojo task. */
    NonDojo = 'NON_DOJO',

    /** The requirement is a yearly task. */
    Yearly = 'YEARLY',
}

/** The categories of a requirement. */
export enum RequirementCategory {
    Welcome = 'Welcome to the Dojo',
    Games = 'Games + Analysis',
    Tactics = 'Tactics',
    Middlegames = 'Middlegames + Strategy',
    Endgame = 'Endgame',
    Opening = 'Opening',
    Graduation = 'Graduation',
    NonDojo = 'Non-Dojo',
    SuggestedTasks = 'Suggested Tasks',
    Pinned = 'Pinned Tasks',
}

/**
 * Converts a requirement category into a user-facing display string.
 * @param category The category to convert.
 */
export function displayRequirementCategory(category: RequirementCategory): string {
    switch(category) {
        case RequirementCategory.Middlegames:
            return 'Middlegame';
        default:
            return category;
    }
}

/** 
 * Converts a requirement category into a short user-facing display string. 
 * @param category The category to convert.
 */
export function displayRequirementCategoryShort(category: RequirementCategory): string {
    switch(category) {
        case RequirementCategory.Welcome:
            return 'Welcome';
        case RequirementCategory.Games:
            return 'Games';
        case RequirementCategory.Middlegames:
            return 'Middlegame';
        default:
            return category;
    }
}
