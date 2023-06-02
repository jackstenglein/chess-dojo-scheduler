export interface CohortStatistics {
    activeParticipants: number;
    inactiveParticipants: number;

    activeDojoScores: number;
    inactiveDojoScores: number;

    activeRatingChanges: number;
    inactiveRatingChanges: number;

    activeRatingSystems: {
        [system: string]: number;
    };
    inactiveRatingSystems: {
        [system: string]: number;
    };

    activeMinutesSpent: number;
    inactiveMinutesSpent: number;
}

export interface UserStatistics {
    cohorts: {
        [cohort: string]: CohortStatistics;
    };
}
