export interface CohortStatistics {
    activeParticipants: number;
    inactiveParticipants: number;
    freeActiveParticipants: number;
    freeInactiveParticipants: number;

    freeTierConversions: number;
    subscriptionCancelations: number;

    activeDojoScores: number;
    inactiveDojoScores: number;

    activeRatingChanges: number;
    inactiveRatingChanges: number;

    activeRatingSystems: Record<string, number>;
    inactiveRatingSystems: Record<string, number>;

    activeMinutesSpent: number;
    inactiveMinutesSpent: number;

    activeRatingChangePerHour: number;
    inactiveRatingChangePerHour: number;

    numGraduations: number;
    graduationMinutes: number;

    avgRatingChangePerDojoPoint: number;
}

export interface UserStatistics {
    cohorts: Record<string, CohortStatistics>;
}
