import { AddCircle, Lock } from '@mui/icons-material';
import {
    Box,
    Checkbox,
    Chip,
    Divider,
    Grid,
    IconButton,
    LinearProgressProps,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import { useRequirements } from '../../api/cache/requirements';
import { useFreeTier } from '../../auth/Auth';
import {
    CustomTask,
    Requirement,
    RequirementProgress,
    ScoreboardDisplay,
    formatTime,
    getCurrentCount,
    getTotalTime,
    isComplete,
    isExpired,
    isRequirement,
} from '../../database/requirement';
import { ALL_COHORTS, User } from '../../database/user';
import RequirementModal from '../../requirements/RequirementModal';
import ScoreboardProgress, { ProgressText } from '../../scoreboard/ScoreboardProgress';
import CustomTaskProgressItem from './CustomTaskProgressItem';
import ProgressDialog from './ProgressDialog';

interface ProgressItemProps {
    user: User;
    progress?: RequirementProgress;
    requirement: Requirement | CustomTask;
    cohort: string;
    isCurrentUser: boolean;
    color?: LinearProgressProps['color'];
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
    color,
}) => {
    const [showUpdateDialog, setShowUpdateDialog] = useState(false);
    const [showReqModal, setShowReqModal] = useState(false);
    const isFreeTier = useFreeTier();
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
                (blocker.isFree || !isFreeTier) &&
                !isComplete(cohort, blocker, user.progress[blockerId])
            ) {
                return {
                    isBlocked: true,
                    reason: `This task is locked until you complete ${blocker.category} - ${blocker.name}.`,
                };
            }
        }
        return { isBlocked: false };
    }, [requirement, requirements, cohort, user, isFreeTier]);

    const totalCount = requirement.counts[cohort] || 0;
    const currentCount = getCurrentCount(cohort, requirement, progress);
    const time = formatTime(getTotalTime(cohort, progress));
    const expired = isExpired(requirement, progress);
    if (!color) {
        color = 'primary';
    }

    let DescriptionElement = null;
    let UpdateElement = null;

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
                    color={color}
                    min={requirement.startCount}
                    isTime={requirement.scoreboardDisplay === ScoreboardDisplay.Minutes}
                    hideProgressText={true}
                    sx={{ height: '6px' }}
                />
            );
            UpdateElement =
                currentCount >= totalCount ? (
                    <Checkbox checked onClick={() => setShowUpdateDialog(true)} />
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
        UpdateElement = <Lock sx={{ marginRight: 1, color: 'gray' }} />;
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
                        <Box
                            display='flex'
                            flexWrap='wrap'
                            justifyContent='space-between'
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
                        </Box>
                        {DescriptionElement}
                    </Grid>
                    <Grid item xs={2} sm='auto' id='task-status'>
                        <Stack>
                            {expired && (
                                <Tooltip title='Your progress on this task has expired and it must be recompleted'>
                                    <Chip
                                        variant='outlined'
                                        color='error'
                                        label='Expired'
                                    />
                                </Tooltip>
                            )}

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
