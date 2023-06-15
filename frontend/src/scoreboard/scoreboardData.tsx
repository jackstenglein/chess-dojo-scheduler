import React, { useState } from 'react';
import {
    GridColDef,
    GridRenderCellParams,
    GridValueGetterParams,
} from '@mui/x-data-grid';

import ScoreboardProgress from './ScoreboardProgress';
import {
    getCurrentCount,
    getCurrentScore,
    getTotalScore,
    Requirement,
    ScoreboardDisplay,
} from '../database/requirement';
import ScoreboardCheck from './ScoreboardCheck';
import {
    formatRatingSystem,
    getCurrentRating as getUserCurrentRating,
    getStartRating as getUserStartRating,
    User,
} from '../database/user';
import { Graduation, isGraduation } from '../database/graduation';
import RequirementModal from '../requirements/RequirementModal';

export type ScoreboardRow = User | Graduation;

interface HeaderProps {
    requirement: Requirement;
    cohort: string;
}

const Header: React.FC<HeaderProps> = ({ requirement, cohort }) => {
    const [showReqModal, setShowReqModal] = useState(false);

    const totalCount = requirement.counts[cohort] || 0;
    let headerName = requirement.name;
    if (requirement.scoreboardDisplay === ScoreboardDisplay.Checkbox && totalCount > 1) {
        headerName += ` (${totalCount})`;
    }

    return (
        <>
            <div onClick={() => setShowReqModal(true)}>{headerName}</div>
            <RequirementModal
                open={showReqModal}
                onClose={() => setShowReqModal(false)}
                requirement={requirement}
            />
        </>
    );
};

export function getColumnDefinition(
    requirement: Requirement,
    cohort: string
): GridColDef<ScoreboardRow> {
    const totalCount = requirement.counts[cohort] || 0;

    const valueGetter = (params: GridValueGetterParams<ScoreboardRow>) => {
        return getCurrentCount(cohort, requirement, params.row.progress[requirement.id]);
    };

    const renderCell = (params: GridRenderCellParams<ScoreboardRow>) => {
        const score = getCurrentCount(
            cohort,
            requirement,
            params.row.progress[requirement.id]
        );
        switch (requirement.scoreboardDisplay) {
            case ScoreboardDisplay.Checkbox:
                return (
                    <ScoreboardCheck
                        value={score}
                        total={totalCount}
                        username={params.row.username}
                        cohort={cohort}
                        requirement={requirement}
                    />
                );

            case ScoreboardDisplay.Unspecified:
            case ScoreboardDisplay.ProgressBar:
            default:
                return (
                    <ScoreboardProgress
                        fullHeight
                        value={score}
                        max={totalCount}
                        min={requirement.startCount}
                        username={params.row.username}
                        cohort={cohort}
                        requirement={requirement}
                        suffix={requirement.progressBarSuffix}
                    />
                );
        }
    };

    let headerName = requirement.name;
    if (requirement.scoreboardDisplay === ScoreboardDisplay.Checkbox && totalCount > 1) {
        headerName += ` (${totalCount})`;
    }

    return {
        field: requirement.id,
        headerName: headerName,
        renderHeader: () => <Header requirement={requirement} cohort={cohort} />,
        minWidth: 250,
        valueGetter,
        renderCell,
        headerAlign: 'center',
    };
}

export function getCohortScore(
    params: GridValueGetterParams<ScoreboardRow>,
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
    return Math.round(score * 100) / 100;
}

export function getTimeSpent(
    params: GridValueGetterParams<ScoreboardRow>,
    cohort: string | undefined
): number {
    if (!cohort) {
        return 0;
    }

    let result = 0;
    for (const progress of Object.values(params.row.progress)) {
        if (progress.minutesSpent && progress.minutesSpent[cohort]) {
            result += progress.minutesSpent[cohort];
        }
    }
    return result;
}

export function getCategoryScore(
    params: GridValueGetterParams<ScoreboardRow>,
    cohort: string | undefined,
    category: string,
    requirements: Requirement[]
): number {
    if (!cohort) {
        return 0;
    }

    const user = params.row;
    let score = 0;
    for (const requirement of requirements) {
        if (requirement.category === category) {
            score += getCurrentScore(cohort, requirement, user.progress[requirement.id]);
        }
    }
    return Math.round(score * 100) / 100;
}

export function getPercentComplete(
    params: GridValueGetterParams<ScoreboardRow>,
    cohort: string | undefined,
    requirements: Requirement[]
): number {
    if (!cohort) {
        return 0;
    }

    const totalScore = getTotalScore(cohort, requirements);
    const userScore = getCohortScore(params, cohort, requirements);
    return (userScore / totalScore) * 100;
}

export function formatPercentComplete(value: number) {
    return `${Math.round(value)}%`;
}

export function getRatingSystem(params: GridValueGetterParams<ScoreboardRow>) {
    return formatRatingSystem(params.row.ratingSystem);
}

export function getStartRating(params: GridValueGetterParams<ScoreboardRow>): number {
    if (isGraduation(params.row)) {
        return params.row.startRating;
    }

    return getUserStartRating(params.row);
}

export function getCurrentRating(params: GridValueGetterParams<ScoreboardRow>): number {
    if (isGraduation(params.row)) {
        return params.row.currentRating;
    }

    return getUserCurrentRating(params.row);
}

export function getRatingChange(params: GridValueGetterParams<ScoreboardRow>) {
    const startRating = getStartRating(params);
    const currentRating = getCurrentRating(params);
    return currentRating - startRating;
}
