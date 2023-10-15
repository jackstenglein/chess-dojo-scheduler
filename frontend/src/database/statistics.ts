export interface CohortStatistics {
    activeParticipants: number;
    inactiveParticipants: number;
    freeParticipants: number;

    freeTierConversions: number;
    subscriptionCancelations: number;

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

    activeRatingChangePerHour: number;
    inactiveRatingChangePerHour: number;

    numGraduations: number;
    graduationMinutes: number;

    avgRatingChangePerDojoPoint: number;
}

export interface UserStatistics {
    cohorts: {
        [cohort: string]: CohortStatistics;
    };
}
