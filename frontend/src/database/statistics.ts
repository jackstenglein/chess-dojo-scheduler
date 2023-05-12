export interface UserStatistics {
    participants: {
        [cohort: string]: number;
    };
    activeParticipants: {
        [cohort: string]: number;
    };

    dojoScores: {
        [cohort: string]: number;
    };
    activeDojoScores: {
        [cohort: string]: number;
    };

    ratingChanges: {
        [cohort: string]: number;
    };
    activeRatingChanges: {
        [cohort: string]: number;
    };

    ratingSystems: {
        [cohort: string]: {
            [system: string]: number;
        };
    };
    activeRatingSystems: {
        [cohort: string]: {
            [system: string]: number;
        };
    };

    minutesSpent: {
        [cohort: string]: number;
    };
    activeMinutesSpent: {
        [cohort: string]: number;
    };
}
