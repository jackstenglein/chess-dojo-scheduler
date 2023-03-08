import {
    GridColDef,
    GridRenderCellParams,
    GridValueFormatterParams,
    GridValueGetterParams,
} from '@mui/x-data-grid';

import ScoreboardProgress from './ScoreboardProgress';
import { Requirement, ScoreboardDisplay } from '../database/requirement';
import ScoreboardCheck from './ScoreboardCheck';
import {
    RatingSystem,
    formatRatingSystem as formatRatingSystemEnum,
    User,
} from '../database/user';

export const testUser: User = {
    username: 'asdfuniqueid',
    discordUsername: 'Heh13#5117',
    bio: 'test data',
    chesscomUsername: 'JackStenglein',
    lichessUsername: 'JackStenglein',
    fideId: '12345678',
    uscfId: '12345678',
    startChesscomRating: 1682,
    currentChesscomRating: 1800,
    startLichessRating: 0,
    currentLichessRating: 0,
    startFideRating: 0,
    currentFideRating: 0,
    startUscfRating: 0,
    currentUscfRating: 0,
    ratingSystem: RatingSystem.Chesscom,
    dojoCohort: '1500-1600',
    progress: {
        '2472fef6-2799-44eb-ba3a-42a4bafc8dbe': {
            requirementId: '2472fef6-2799-44eb-ba3a-42a4bafc8dbe',
            counts: {
                ALL_COHORTS: 3672,
            },
            minutesSpent: {
                '1500-1600': 180,
            },
            updatedAt: '2022-03-02',
        },
        '654c679f-9f61-4552-83ff-c04fe7f5e182': {
            requirementId: '654c679f-9f61-4552-83ff-c04fe7f5e182',
            counts: {
                '1600-1700': 1,
            },
            minutesSpent: {
                '1600-1700': 30,
            },
            updatedAt: '2022-03-02',
        },
    },
    timeline: [],
    disableBookingNotifications: false,
    disableCancellationNotifications: false,
    isAdmin: false,
};

export function getColumnDefinition(
    requirement: Requirement,
    cohort?: string
): GridColDef {
    const totalCount =
        requirement.counts.ALL_COHORTS || requirement.counts[cohort ?? ''] || 1;

    const getScore = (user: User) => {
        const progress = user.progress[requirement.id];
        if (!progress) {
            return 0;
        }
        if (progress.counts.ALL_COHORTS) {
            return progress.counts.ALL_COHORTS;
        }
        if (!cohort) {
            return 0;
        }
        return progress.counts[cohort] || 0;
    };

    const valueGetter = (params: GridValueGetterParams<any, User>) => {
        return getScore(params.row);
    };

    const renderCell = (params: GridRenderCellParams<number, User>) => {
        const score = getScore(params.row);
        switch (requirement.scoreboardDisplay) {
            case ScoreboardDisplay.Checkbox:
                return <ScoreboardCheck value={score} total={totalCount} />;

            case ScoreboardDisplay.Unspecified:
            case ScoreboardDisplay.ProgressBar:
            default:
                return <ScoreboardProgress value={score} max={totalCount} min={0} />;
        }
    };

    return {
        field: requirement.id,
        headerName: requirement.name,
        minWidth: 250,
        valueGetter,
        renderCell,
    };
}

export function formatRatingSystem(params: GridValueFormatterParams<RatingSystem>) {
    return formatRatingSystemEnum(params.value);
}

export function getStartRating(params: GridValueGetterParams<any, User>): number {
    const ratingSystem = params.row.ratingSystem;

    switch (ratingSystem) {
        case RatingSystem.Chesscom:
            return params.row.startChesscomRating;
        case RatingSystem.Lichess:
            return params.row.startLichessRating;
        case RatingSystem.Fide:
            return params.row.startFideRating;
        case RatingSystem.Uscf:
            return params.row.startUscfRating;

        default:
            return 0;
    }
}

export function getCurrentRating(params: GridValueGetterParams<any, User>): number {
    const ratingSystem = params.row.ratingSystem;

    switch (ratingSystem) {
        case RatingSystem.Chesscom:
            return params.row.currentChesscomRating;
        case RatingSystem.Lichess:
            return params.row.currentLichessRating;
        case RatingSystem.Fide:
            return params.row.currentFideRating;
        case RatingSystem.Uscf:
            return params.row.currentUscfRating;

        default:
            return 0;
    }
}

export function getRatingIncrease(params: GridValueGetterParams<any, User>) {
    const startRating = getStartRating(params);
    const currentRating = getCurrentRating(params);
    return currentRating - startRating;
}
