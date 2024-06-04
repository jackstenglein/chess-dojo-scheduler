import {
    GridColDef,
    GridRenderCellParams,
    GridValueGetterParams,
} from '@mui/x-data-grid-pro';
import React, { useState } from 'react';

import { Graduation, isGraduation } from '../database/graduation';
import {
    Requirement,
    ScoreboardDisplay,
    getCurrentCount,
    getCurrentScore,
    getTotalScore,
} from '../database/requirement';
import { ScoreboardSummary, isScoreboardSummary } from '../database/scoreboard';
import {
    MinutesSpentKey,
    RatingSystem,
    User,
    formatRatingSystem,
    getCurrentRating as getUserCurrentRating,
    getStartRating as getUserStartRating,
    normalizeToFide,
} from '../database/user';
import RequirementModal from '../requirements/RequirementModal';
import ScoreboardCheck from './ScoreboardCheck';
import ScoreboardProgress from './ScoreboardProgress';

export type ScoreboardRow = User | Graduation | ScoreboardSummary;

interface HeaderProps {
    requirement: Requirement;
    cohort: string;
}

const Header: React.FC<HeaderProps> = ({ requirement, cohort }) => {
    const [showReqModal, setShowReqModal] = useState(false);

    const totalCount = requirement.counts[cohort] || 0;
    let headerName = requirement.name.replaceAll('{{count}}', `${totalCount}`);
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
                cohort={cohort}
            />
        </>
    );
};

/**
 * Returns the progress object for the given ScoreboardRow or an empty
 * object if the row is a ScoreboardSummary.
 * @param row The ScoreboardRow to get the progress for.
 * @returns The progress for the row.
 */
function getProgress(row: ScoreboardRow) {
    if (isScoreboardSummary(row)) {
        return {};
    }
    return row.progress;
}

export function getColumnDefinition(
    requirement: Requirement,
    cohort: string,
): GridColDef<ScoreboardRow> {
    const totalCount = requirement.counts[cohort] || 0;

    const valueGetter = (params: GridValueGetterParams<ScoreboardRow>) => {
        return getCurrentCount(
            cohort,
            requirement,
            getProgress(params.row)[requirement.id],
        );
    };

    const renderCell = (params: GridRenderCellParams<ScoreboardRow>) => {
        const score = getCurrentCount(
            cohort,
            requirement,
            getProgress(params.row)[requirement.id],
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
            case ScoreboardDisplay.Minutes:
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
                        isTime={
                            requirement.scoreboardDisplay === ScoreboardDisplay.Minutes
                        }
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
    requirements: Requirement[],
): number {
    if (!cohort) {
        return 0;
    }

    const progress = getProgress(params.row);
    let score = 0;
    for (const requirement of requirements) {
        score += getCurrentScore(cohort, requirement, progress[requirement.id]);
    }
    return Math.round(score * 100) / 100;
}

export function getTotalTime(
    params: GridValueGetterParams<ScoreboardRow>,
    cohort: string | undefined,
    nonDojoOnly: boolean,
    requirements: Requirement[],
): number {
    if (!cohort) {
        return 0;
    }

    const requirementIds = new Set(
        requirements
            .filter((r) => (r.category === 'Non-Dojo') === nonDojoOnly)
            .map((r) => r.id),
    );

    let result = 0;
    for (const progress of Object.values(getProgress(params.row))) {
        if (
            progress.minutesSpent[cohort] &&
            requirementIds.has(progress.requirementId)
        ) {
            result += progress.minutesSpent[cohort];
        }
    }
    return result;
}

export function getCategoryScore(
    params: GridValueGetterParams<ScoreboardRow>,
    cohort: string | undefined,
    category: string,
    requirements: Requirement[],
): number {
    if (!cohort) {
        return 0;
    }

    const progress = getProgress(params.row);
    let score = 0;
    for (const requirement of requirements) {
        if (requirement.category === category) {
            score += getCurrentScore(cohort, requirement, progress[requirement.id]);
        }
    }
    return Math.round(score * 100) / 100;
}

export function getPercentComplete(
    params: GridValueGetterParams<ScoreboardRow>,
    cohort: string | undefined,
    requirements: Requirement[],
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
    if (
        params.row.ratingSystem === RatingSystem.Custom &&
        !isGraduation(params.row) &&
        params.row.ratings[RatingSystem.Custom]?.name
    ) {
        return `Custom (${params.row.ratings[RatingSystem.Custom].name})`;
    }
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

export function getNormalizedRating(
    params: GridValueGetterParams<ScoreboardRow>,
): number {
    return normalizeToFide(getCurrentRating(params), params.row.ratingSystem);
}

export function getMinutesSpent(
    params: GridValueGetterParams<ScoreboardRow>,
    key: MinutesSpentKey,
): number {
    if (isGraduation(params.row)) {
        return 0;
    }
    return params.row.minutesSpent ? params.row.minutesSpent[key] || 0 : 0;
}
