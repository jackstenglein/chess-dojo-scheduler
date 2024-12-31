import { useRequirements } from '@/api/cache/requirements';
import {
    CustomTask,
    Requirement,
    RequirementProgress,
    ScoreboardDisplay,
    formatTime,
    getCurrentCount,
    getTotalTime,
    isBlocked,
    isExpired,
    isRequirement,
} from '@/database/requirement';
import { ALL_COHORTS, User } from '@/database/user';
import RequirementModal from '@/requirements/RequirementModal';
import ScoreboardProgress, { ProgressText } from '@/scoreboard/ScoreboardProgress';
import { AddCircle, Lock } from '@mui/icons-material';
import {
    Box,
    Checkbox,
    Chip,
    Divider,
    Grid,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import CustomTaskProgressItem from './CustomTaskProgressItem';
import ProgressDialog from './ProgressDialog';

interface ProgressItemProps {
    user: User;
    progress?: RequirementProgress;
    requirement: Requirement | CustomTask;
    cohort: string;
    isCurrentUser: boolean;
}

const ProgressItem: React.FC<ProgressItemProps> = ({
    user,
    progress,
    requirement,
    cohort,
    isCurrentUser,
}) => {
    if (!isRequirement(requirement)) {
        return (
            <CustomTaskProgressItem
                progress={progress}
                task={requirement}
                cohort={cohort}
            />
        );
    }

    return (
        <RequirementProgressItem
            user={user}
            progress={progress}
            requirement={requirement}
            cohort={cohort}
            isCurrentUser={isCurrentUser}
        />
    );
};

export default ProgressItem;

interface RequirementProgressItemProps extends ProgressItemProps {
    requirement: Requirement;
}

const RequirementProgressItem: React.FC<RequirementProgressItemProps> = ({
    user,
    progress,
    requirement,
    cohort,
    isCurrentUser,
}) => {
    const [showUpdateDialog, setShowUpdateDialog] = useState(false);
    const [showReqModal, setShowReqModal] = useState(false);
    const { requirements } = useRequirements(ALL_COHORTS, false);

    const blocker = useMemo(() => {
        return isBlocked(cohort, user, requirement, requirements);
    }, [requirement, requirements, cohort, user]);

    const totalCount = requirement.counts[cohort] || 0;
    const currentCount = getCurrentCount(cohort, requirement, progress);
    const time = formatTime(getTotalTime(cohort, progress));
    const expired = isExpired(requirement, progress);

    let DescriptionElement = null;
    let UpdateElement = null;

    let color: string | undefined = undefined;
    if (isCurrentUser && currentCount >= totalCount) {
        color = 'trainingPlanTaskComplete.main';
    } else if (isCurrentUser) {
        color = 'primary.main';
    }

    switch (requirement.scoreboardDisplay) {
        case ScoreboardDisplay.Hidden:
        case ScoreboardDisplay.Checkbox:
            UpdateElement = (
                <Checkbox
                    aria-label={`Checkbox ${requirement.name}`}
                    checked={currentCount >= totalCount}
                    onClick={() => setShowUpdateDialog(true)}
                    disabled={!isCurrentUser}
                    sx={{
                        color,
                        '&.Mui-checked:not(.Mui-disabled)': {
                            color,
                        },
                    }}
                />
            );
            break;

        case ScoreboardDisplay.ProgressBar:
        case ScoreboardDisplay.Minutes:
        case ScoreboardDisplay.Unspecified:
            DescriptionElement = (
                <ScoreboardProgress
                    value={currentCount}
                    max={totalCount}
                    min={requirement.startCount}
                    isTime={requirement.scoreboardDisplay === ScoreboardDisplay.Minutes}
                    hideProgressText={true}
                    sx={{ height: '6px' }}
                />
            );
            UpdateElement =
                currentCount >= totalCount ? (
                    <Checkbox
                        checked
                        onClick={() => setShowUpdateDialog(true)}
                        color={isCurrentUser ? 'trainingPlanTaskComplete' : undefined}
                    />
                ) : !isCurrentUser ? null : (
                    <IconButton
                        aria-label={`Update ${requirement.name}`}
                        onClick={() => setShowUpdateDialog(true)}
                    >
                        <AddCircle color='primary' />
                    </IconButton>
                );
            break;

        case ScoreboardDisplay.NonDojo:
            UpdateElement = (
                <IconButton
                    aria-label={`Update ${requirement.name}`}
                    onClick={() => setShowUpdateDialog(true)}
                >
                    <AddCircle color='primary' />
                </IconButton>
            );
            break;
    }

    let requirementName = requirement.name.replaceAll('{{count}}', `${totalCount}`);
    if (requirement.scoreboardDisplay === ScoreboardDisplay.Checkbox && totalCount > 1) {
        requirementName += ` (${totalCount})`;
    }

    if (blocker.isBlocked) {
        UpdateElement = <Lock sx={{ marginRight: 1, color: 'text.secondary' }} />;
    }

    return (
        <Tooltip title={blocker.reason} followCursor>
            <Stack spacing={2} mt={2}>
                {showUpdateDialog && (
                    <ProgressDialog
                        open={showUpdateDialog}
                        onClose={() => setShowUpdateDialog(false)}
                        requirement={requirement}
                        cohort={cohort}
                        progress={progress}
                    />
                )}
                <Grid
                    container
                    columnGap={0.5}
                    alignItems='center'
                    justifyContent='space-between'
                    position='relative'
                >
                    <Grid
                        item
                        xs={9}
                        xl={
                            requirement.scoreboardDisplay === ScoreboardDisplay.NonDojo
                                ? 9
                                : 10
                        }
                        onClick={() => setShowReqModal(true)}
                        sx={{ cursor: 'pointer', position: 'relative' }}
                        id='task-details'
                        display='flex'
                        flexDirection='column'
                        rowGap='0.25rem'
                    >
                        {expired && (
                            <Tooltip title='Your progress on this task has expired and it must be recompleted'>
                                <Chip
                                    variant='outlined'
                                    color='error'
                                    label='Expired'
                                    size='small'
                                    sx={{ alignSelf: 'start', mb: 0.5 }}
                                />
                            </Tooltip>
                        )}

                        <Stack
                            direction='row'
                            flexWrap='wrap'
                            justifyContent='space-between'
                            alignItems='center'
                            columnGap='1rem'
                        >
                            <Typography
                                sx={{
                                    opacity: blocker.isBlocked ? 0.5 : 1,
                                    fontWeight: 'bold',
                                }}
                            >
                                {requirementName}
                            </Typography>
                            {showCount(requirement) && (
                                <Box mr={1}>
                                    <ProgressText
                                        value={currentCount}
                                        max={totalCount}
                                        min={requirement.startCount}
                                        isTime={
                                            requirement.scoreboardDisplay ===
                                            ScoreboardDisplay.Minutes
                                        }
                                    />
                                </Box>
                            )}
                        </Stack>
                        {DescriptionElement}
                    </Grid>
                    <Grid item xs={2} sm='auto' id='task-status'>
                        <Stack
                            direction='row'
                            alignItems='center'
                            justifyContent='end'
                            gap={1}
                        >
                            {!blocker.isBlocked && (
                                <Typography
                                    color='text.secondary'
                                    sx={{
                                        display: { xs: 'none', sm: 'initial' },
                                        fontWeight: 'bold',
                                    }}
                                    noWrap
                                    textOverflow='unset'
                                >
                                    {time}
                                </Typography>
                            )}
                            {UpdateElement}
                        </Stack>
                    </Grid>
                </Grid>
                <Divider />

                {showReqModal && (
                    <RequirementModal
                        open={showReqModal}
                        onClose={() => setShowReqModal(false)}
                        requirement={requirement}
                        cohort={cohort}
                    />
                )}
            </Stack>
        </Tooltip>
    );
};

function showCount(requirement: Requirement): boolean {
    return (
        requirement.scoreboardDisplay !== ScoreboardDisplay.NonDojo &&
        requirement.scoreboardDisplay !== ScoreboardDisplay.Checkbox &&
        requirement.scoreboardDisplay !== ScoreboardDisplay.Hidden
    );
}
