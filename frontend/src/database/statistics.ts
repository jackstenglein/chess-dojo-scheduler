import { RatingSystem } from './user';

export interface UserStatistics {
    participants: {
        [cohort: string]: number;
    };
    activeParticipants: {
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
