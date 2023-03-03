import {
    GridColDef,
    GridRenderCellParams,
    GridValueFormatterParams,
    GridValueGetterParams,
} from '@mui/x-data-grid';

import ScoreboardProgress from './ScoreboardProgress';
import {
    Requirement,
    RequirementProgress,
    ScoreboardDisplay,
} from '../database/requirement';
import ScoreboardCheck from './ScoreboardCheck';

export interface ScoreboardUser {
    username: string;
    discordUsername: string;
    ratingSystem: 'chesscom' | 'lichess' | 'fide' | 'uscf';
    startRating: number;
    currentRating: number;
    dojoCohort: string;
    progress: {
        [id: string]: RequirementProgress;
    };
    [x: string | number | symbol]: unknown;
}

export const testUser: ScoreboardUser = {
    username: 'asdfuniqueid',
    discordUsername: 'Heh13#5117',
    chesscomUsername: 'JackStenglein',
    lichessUsername: 'JackStenglein',
    fideId: '12345678',
    uscfId: '12345678',
    startRating: 1692,
    currentRating: 1800,
    ratingSystem: 'chesscom',
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
};

export function getColumnDefinition(
    requirement: Requirement,
    cohort?: string
): GridColDef {
    const totalCount =
        requirement.counts.ALL_COHORTS || requirement.counts[cohort ?? ''] || 1;

    const getScore = (user: ScoreboardUser) => {
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

    const valueGetter = (params: GridValueGetterParams<any, ScoreboardUser>) => {
        return getScore(params.row);
    };

    const renderCell = (params: GridRenderCellParams<number, ScoreboardUser>) => {
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

export function formatRatingSystem(params: GridValueFormatterParams<string>) {
    if (params.value === 'chesscom') {
        return 'Chess.com Rapid';
    }
    if (params.value === 'lichess') {
        return 'Lichess Classical';
    }
    if (params.value === 'fide') {
        return 'FIDE';
    }
    if (params.value === 'uscf') {
        return 'USCF';
    }
}

export function ratingIncreaseGetter(params: GridValueGetterParams<any, ScoreboardUser>) {
    return params.row.currentRating - params.row.startRating;
}
