import React, { useMemo, useState } from 'react';
import { useAuth } from '../auth/Auth';
import { Stack, Typography, Chip, Button, Box, Grid, Tooltip } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import ScoreboardIcon from '@mui/icons-material/Scoreboard';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';

import {
    CustomTask,
    Requirement,
    ScoreboardDisplay,
    getTotalCount,
    getUnitScore,
    isRequirement,
} from '../database/requirement';
import { ALL_COHORTS, compareCohorts, dojoCohorts } from '../database/user';
import ProgressDialog from '../profile/progress/ProgressDialog';
import Position from './Position';
import CustomTaskDisplay from './CustomTaskDisplay';

function dojoPointDescription(requirement: Requirement, cohort: string) {
    if (requirement.totalScore) {
        return `This task awards ${requirement.totalScore} Dojo Point
                ${requirement.totalScore !== 1 ? 's' : ''} upon completion.`;
    }

    const unitScore = Math.round(100 * getUnitScore(cohort, requirement)) / 100;

    if (unitScore === 0) {
        return 'This task awards no Dojo Points.';
    }

    if (getTotalCount(cohort, requirement) === 1) {
        return `This task awards ${unitScore} Dojo Point${unitScore !== 1 ? 's' : ''} upon
                completion.`;
    }

    let unit = 'unit';
    if (requirement.progressBarSuffix === '%') {
        unit = 'percentage';
    } else if (requirement.progressBarSuffix) {
        unit = requirement.progressBarSuffix.toLowerCase();
        if (unit[unit.length - 1] === 's') {
            unit = unit.substring(0, unit.length - 1);
        }
    }

    return `This task awards ${unitScore} Dojo Point${
        unitScore !== 1 ? 's' : ''
    } per ${unit} completed.`;
}

const DojoPointChip: React.FC<{ requirement: Requirement; cohort: string }> = ({
    requirement,
    cohort,
}) => {
    const description = dojoPointDescription(requirement, cohort);
    const score = requirement.totalScore
        ? requirement.totalScore
        : Math.round(100 * getUnitScore(cohort, requirement)) / 100;

    return (
        <Tooltip title={description}>
            <Chip
                color='secondary'
                icon={<ScoreboardIcon />}
                label={`${score} point${score !== 1 ? 's' : ''}`}
            />
        </Tooltip>
    );
};

const ExpirationChip: React.FC<{ requirement: Requirement }> = ({ requirement }) => {
    const expirationYears = requirement.expirationDays / 365;
    if (!expirationYears) {
        return null;
    }

    const value =
        expirationYears >= 1 ? expirationYears : Math.round(expirationYears * 12);

    const title = `Progress on this task expires after ${value} ${
        expirationYears >= 1 ? 'year' : 'month'
    }${value !== 1 ? 's' : ''}.`;

    return (
        <Tooltip title={title}>
            <Chip
                color='secondary'
                icon={<AccessAlarmIcon />}
                label={`${value} ${expirationYears >= 1 ? 'year' : 'month'}${
                    value !== 1 ? 's' : ''
                }`}
            />
        </Tooltip>
    );
};

interface RequirementDisplayProps {
    requirement: Requirement | CustomTask;
    onClose?: () => void;
}

const RequirementDisplay: React.FC<RequirementDisplayProps> = ({
    requirement,
    onClose,
}) => {
    const user = useAuth().user!;
    const [showUpdateDialog, setShowUpdateDialog] = useState(false);

    const cohort = useMemo(() => {
        if (!requirement) {
            return user.dojoCohort;
        }
        const cohortOptions = requirement.counts.ALL_COHORTS
            ? dojoCohorts
            : Object.keys(requirement.counts).sort(compareCohorts);
        return cohortOptions.includes(user.dojoCohort)
            ? user.dojoCohort
            : cohortOptions[0];
    }, [requirement, user.dojoCohort]);

    if (!isRequirement(requirement)) {
        return <CustomTaskDisplay task={requirement} onClose={onClose} />;
    }

    const progress = user.progress[requirement.id];

    const totalCount = requirement.counts[cohort] || requirement.counts[ALL_COHORTS];
    const currentCount = progress?.counts[cohort] || progress?.counts[ALL_COHORTS] || 0;
    const isComplete = currentCount >= totalCount;

    let requirementName = requirement.name;
    if (requirement.scoreboardDisplay === ScoreboardDisplay.Checkbox && totalCount > 1) {
        requirementName += ` (${totalCount})`;
    }

    return (
        <>
            <Stack spacing={3}>
                <Stack
                    direction='row'
                    justifyContent='space-between'
                    alignItems='center'
                    flexWrap='wrap'
                    rowGap={1}
                >
                    <Stack>
                        <Typography variant='h4'>{requirementName}</Typography>
                        <Typography variant='h5' color='text.secondary'>
                            {requirement.category}
                        </Typography>
                    </Stack>
                    <Stack direction='row' spacing={2} alignItems='center'>
                        {isComplete && (
                            <Chip
                                icon={<CheckIcon />}
                                label='Completed'
                                color='success'
                                onClick={() => setShowUpdateDialog(true)}
                            />
                        )}
                        {!isComplete && (
                            <Button
                                variant='contained'
                                onClick={() => setShowUpdateDialog(true)}
                            >
                                Update Progress
                            </Button>
                        )}
                    </Stack>
                </Stack>

                <Stack direction='row' spacing={2} flexWrap='wrap' rowGap={1}>
                    <DojoPointChip requirement={requirement} cohort={cohort} />
                    <ExpirationChip requirement={requirement} />
                </Stack>

                <Typography
                    variant='body1'
                    sx={{ whiteSpace: 'pre-line', mt: 3 }}
                    dangerouslySetInnerHTML={{ __html: requirement.description }}
                />

                {requirement.positions && (
                    <Grid container spacing={2}>
                        {requirement.positions.map((p) => (
                            <Grid key={p.fen} item xs='auto'>
                                <Position position={p} />
                            </Grid>
                        ))}
                    </Grid>
                )}

                {requirement.videoUrls &&
                    requirement.videoUrls.map((url, idx) => (
                        <Box sx={{ mt: 3, width: 1, aspectRatio: '1.77' }} key={url}>
                            <iframe
                                src={url}
                                title={`${requirement.name} Video ${idx + 1}`}
                                allow='accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share'
                                allowFullScreen={true}
                                style={{ width: '100%', height: '100%' }}
                                frameBorder={0}
                            />
                        </Box>
                    ))}
            </Stack>

            <ProgressDialog
                open={showUpdateDialog}
                onClose={() => setShowUpdateDialog(false)}
                requirement={requirement}
                cohort={user.dojoCohort}
                progress={progress}
                selectCohort
            />
        </>
    );
};

export default RequirementDisplay;
