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

export function getCohortScore(
    params: GridValueGetterParams<any, User>,
    cohort: string | undefined,
    requirements: Requirement[]
): number {
    if (!cohort) {
        return 0;
    }

    const user = params.row;
    let score = 0;
    for (const requirement of requirements) {
        const progress = user.progress[requirement.id];
        if (!progress) {
            continue;
        }
        const count = progress.counts[cohort] || 0;
        score += count * requirement.unitScore;
    }

    return score;
}

export function getPercentComplete(
    params: GridValueGetterParams<any, User>,
    cohort: string | undefined,
    requirements: Requirement[]
): number {
    if (!cohort) {
        return 0;
    }

    const totalScore = requirements.reduce((sum, r) => {
        const count = r.counts.ALL_COHORTS || r.counts[cohort] || 1;
        return sum + count * r.unitScore;
    }, 0);

    console.log('Total score: ', totalScore);

    const userScore = getCohortScore(params, cohort, requirements);
    return (userScore / totalScore) * 100;
}

export function formatPercentComplete(params: GridValueFormatterParams<number>) {
    return `${Math.round(params.value)}%`;
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

export function getRatingChange(params: GridValueGetterParams<any, User>) {
    const startRating = getStartRating(params);
    const currentRating = getCurrentRating(params);
    return currentRating - startRating;
}
