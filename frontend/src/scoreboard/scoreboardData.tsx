import {
    GridColDef,
    GridRenderCellParams,
    GridValueFormatterParams,
    GridValueGetterParams,
} from '@mui/x-data-grid';

import ScoreboardProgress from './ScoreboardProgress';
import {
    getCurrentCount,
    getCurrentScore,
    Requirement,
    ScoreboardDisplay,
} from '../database/requirement';
import ScoreboardCheck from './ScoreboardCheck';
import {
    RatingSystem,
    formatRatingSystem as formatRatingSystemEnum,
    User,
} from '../database/user';
import { Graduation, isGraduation } from '../database/graduation';

export type ScoreboardRow = User | Graduation;

export function getColumnDefinition(
    requirement: Requirement,
    cohort: string
): GridColDef<ScoreboardRow> {
    const totalCount = requirement.counts[cohort] || 0;

    const valueGetter = (params: GridValueGetterParams<any, ScoreboardRow>) => {
        return getCurrentCount(cohort, requirement, params.row.progress[requirement.id]);
    };

    const renderCell = (params: GridRenderCellParams<number, ScoreboardRow>) => {
        const score = getCurrentCount(
            cohort,
            requirement,
            params.row.progress[requirement.id]
        );
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
    params: GridValueGetterParams<any, ScoreboardRow>,
    cohort: string | undefined,
    requirements: Requirement[]
): number {
    if (!cohort) {
        return 0;
    }

    const user = params.row;
    let score = 0;
    for (const requirement of requirements) {
        score += getCurrentScore(cohort, requirement, user.progress[requirement.id]);
    }
    return score;
}

export function getPercentComplete(
    params: GridValueGetterParams<any, ScoreboardRow>,
    cohort: string | undefined,
    requirements: Requirement[]
): number {
    if (!cohort) {
        return 0;
    }

    const totalScore = requirements.reduce((sum, r) => {
        const count = r.counts[cohort] || 0;
        return sum + count * r.unitScore;
    }, 0);

    const userScore = getCohortScore(params, cohort, requirements);
    return (userScore / totalScore) * 100;
}

export function formatPercentComplete(params: GridValueFormatterParams<number>) {
    return `${Math.round(params.value)}%`;
}

export function formatRatingSystem(params: GridValueFormatterParams<RatingSystem>) {
    return formatRatingSystemEnum(params.value);
}

export function getStartRating(
    params: GridValueGetterParams<any, ScoreboardRow>
): number {
    if (isGraduation(params.row)) {
        return params.row.startRating;
    }

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

export function getCurrentRating(
    params: GridValueGetterParams<any, ScoreboardRow>
): number {
    if (isGraduation(params.row)) {
        return params.row.currentRating;
    }

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

export function getRatingChange(params: GridValueGetterParams<any, ScoreboardRow>) {
    const startRating = getStartRating(params);
    const currentRating = getCurrentRating(params);
    return currentRating - startRating;
}
