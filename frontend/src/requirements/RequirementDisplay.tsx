import { Edit, Lock, Loop } from '@mui/icons-material';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import CheckIcon from '@mui/icons-material/Check';
import ScoreboardIcon from '@mui/icons-material/Scoreboard';
import { Box, Button, Chip, Grid, Stack, Tooltip, Typography } from '@mui/material';
import React, { useMemo, useState } from 'react';
import { useRequirements } from '../api/cache/requirements';
import { useAuth, useFreeTier } from '../auth/Auth';
import {
    CustomTask,
    Requirement,
    ScoreboardDisplay,
    getTotalCount,
    getUnitScore,
    isComplete,
    isRequirement,
} from '../database/requirement';
import { ALL_COHORTS, compareCohorts, dojoCohorts } from '../database/user';
import ProgressDialog from '../profile/progress/ProgressDialog';
import CustomTaskDisplay from './CustomTaskDisplay';
import Position from './Position';

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
        if (unit.endsWith('s')) {
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
    let unitScore = getUnitScore(cohort, requirement);
    if (requirement.scoreboardDisplay === ScoreboardDisplay.Minutes) {
        unitScore *= 60;
    }

    const score = requirement.totalScore
        ? requirement.totalScore
        : Math.round(100 * unitScore) / 100;

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
    if (requirement.expirationDays < 0) {
        return null;
    }

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

const RepeatChip: React.FC<{ requirement: Requirement }> = ({ requirement }) => {
    let title = '';
    let label = '';

    if (requirement.numberOfCohorts === -1) {
        title = 'Progress on this task resets across each cohort';
        label = 'Progress Resets';
    } else if (requirement.numberOfCohorts === 1 || requirement.numberOfCohorts === 0) {
        title = 'Progress on this task carries over to other cohorts';
        label = 'Progress Carries Over';
    } else {
        title = `This task must be completed in ${requirement.numberOfCohorts} cohorts`;
        label = `${requirement.numberOfCohorts} Cohorts`;
    }

    return (
        <Tooltip title={title}>
            <Chip color='secondary' icon={<Loop />} label={label} />
        </Tooltip>
    );
};

const BlockerChips: React.FC<{ requirement: Requirement }> = ({ requirement }) => {
    const { requirements } = useRequirements(ALL_COHORTS, false);
    const requirementMap = useMemo(() => {
        return requirements.reduce<Record<string, Requirement>>((acc, r) => {
            acc[r.id] = r;
            return acc;
        }, {});
    }, [requirements]);

    if (!requirement.blockers || requirement.blockers.length === 0) {
        return null;
    }

    return (
        <>
            {requirement.blockers.map((id) => {
                const blocker = requirementMap[id];
                if (!blocker) {
                    return null;
                }

                return (
                    <Tooltip
                        key={id}
                        title={`You must complete ${blocker.category} - ${blocker.name} to update this task`}
                    >
                        <Chip color='secondary' icon={<Lock />} label={blocker.name} />
                    </Tooltip>
                );
            })}
        </>
    );
};

interface RequirementDisplayProps {
    requirement: Requirement | CustomTask;
    onClose?: () => void;
    cohort?: string;
}

const RequirementDisplay: React.FC<RequirementDisplayProps> = ({
    requirement,
    onClose,
    cohort,
}) => {
    const { user } = useAuth();
    const [showUpdateDialog, setShowUpdateDialog] = useState(false);
    const isFreeTier = useFreeTier();

    const selectedCohort = useMemo(() => {
        if (!requirement) {
            return cohort || user?.dojoCohort;
        }

        const cohortOptions = requirement.counts[ALL_COHORTS]
            ? dojoCohorts
            : Object.keys(requirement.counts);

        if (cohort && cohortOptions.includes(cohort)) {
            return cohort;
        }
        if (user?.dojoCohort && cohortOptions.includes(user.dojoCohort)) {
            return user.dojoCohort;
        }

        return cohortOptions.sort(compareCohorts)[0];
    }, [requirement, user?.dojoCohort, cohort]);

    const { requirements } = useRequirements(ALL_COHORTS, false);

    const blocker = useMemo(() => {
        if (!isRequirement(requirement)) {
            return { isBlocked: false };
        }

        if (!requirement.blockers || requirement.blockers.length === 0) {
            return { isBlocked: false };
        }

        const requirementMap = requirements.reduce<Record<string, Requirement>>(
            (acc, r) => {
                acc[r.id] = r;
                return acc;
            },
            {},
        );
        for (const blockerId of requirement.blockers) {
            const blocker = requirementMap[blockerId];
            if (
                blocker &&
                selectedCohort &&
                !isComplete(selectedCohort, blocker, user?.progress[blockerId])
            ) {
                return {
                    isBlocked: true,
                    reason: `This task is locked until you complete ${blocker.category} - ${blocker.name}.`,
                };
            }
        }
        return { isBlocked: false };
    }, [requirement, requirements, selectedCohort, user]);

    if (!isRequirement(requirement)) {
        return <CustomTaskDisplay task={requirement} onClose={onClose} />;
    }

    if (!selectedCohort) {
        return null;
    }

    const progress = user?.progress[requirement.id];

    const totalCount =
        requirement.counts[selectedCohort] || requirement.counts[ALL_COHORTS];
    const currentCount =
        progress?.counts[selectedCohort] || progress?.counts[ALL_COHORTS] || 0;
    const isCompleted = currentCount >= totalCount;

    let requirementName = requirement.name.replaceAll('{{count}}', `${totalCount}`);
    if (requirement.scoreboardDisplay === ScoreboardDisplay.Checkbox && totalCount > 1) {
        requirementName += ` (${totalCount})`;
    }

    let description = isFreeTier
        ? requirement.freeDescription || requirement.description
        : requirement.description;
    description = description.replaceAll('{{count}}', `${totalCount}`);

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
                        {blocker.isBlocked ? (
                            <Tooltip title={blocker.reason}>
                                <Chip icon={<Lock />} label='Locked' color='error' />
                            </Tooltip>
                        ) : isCompleted ? (
                            <Chip
                                icon={<CheckIcon />}
                                label='Completed'
                                color='success'
                                onClick={() => setShowUpdateDialog(true)}
                            />
                        ) : (
                            <Button
                                variant='contained'
                                onClick={() => setShowUpdateDialog(true)}
                                color='success'
                                startIcon={<Edit />}
                            >
                                Update Progress
                            </Button>
                        )}
                    </Stack>
                </Stack>

                <Stack direction='row' spacing={2} flexWrap='wrap' rowGap={1}>
                    <DojoPointChip requirement={requirement} cohort={selectedCohort} />
                    <ExpirationChip requirement={requirement} />
                    <RepeatChip requirement={requirement} />
                    {requirement.blockers && <BlockerChips requirement={requirement} />}
                </Stack>

                <Typography
                    variant='body1'
                    sx={{ whiteSpace: 'pre-line', mt: 3 }}
                    dangerouslySetInnerHTML={{ __html: description }}
                />

                {requirement.positions && (
                    <Grid container gap={2}>
                        {requirement.positions.map((p) => (
                            <Grid key={p.fen} item md='auto'>
                                <Position position={p} />
                            </Grid>
                        ))}
                    </Grid>
                )}

                {requirement.videoUrls?.map((url, idx) => (
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
                cohort={selectedCohort}
                progress={progress}
                selectCohort
            />
        </>
    );
};

export default RequirementDisplay;
