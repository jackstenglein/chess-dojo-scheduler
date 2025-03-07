import { useRequirements } from '@/api/cache/requirements';
import {
    CustomTask,
    Requirement,
    RequirementCategory,
    RequirementProgress,
    ScoreboardDisplay,
    formatTime,
    getCurrentCount,
    getTotalTime,
    isBlocked,
    isExpired,
} from '@/database/requirement';
import { ALL_COHORTS, User } from '@/database/user';
import ScoreboardProgress, { ProgressText } from '@/scoreboard/ScoreboardProgress';
import { AddCircle, Lock, PushPin, PushPinOutlined } from '@mui/icons-material';
import {
    Box,
    Checkbox,
    Chip,
    Divider,
    Grid2,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { TaskDialog, TaskDialogView } from '../TaskDialog';
import { displayProgress } from '../daily/TimeframeTrainingPlanItem';

interface FullTrainingPlanItemProps {
    user: User;
    progress?: RequirementProgress;
    requirement: Requirement | CustomTask;
    cohort: string;
    isCurrentUser: boolean;
    togglePin: (req: Requirement | CustomTask) => void;
    isPinned: boolean;
}

export const FullTrainingPlanItem = ({
    user,
    progress,
    requirement,
    cohort,
    isCurrentUser,
    togglePin,
    isPinned,
}: FullTrainingPlanItemProps) => {
    const [taskDialogView, setTaskDialogView] = useState<TaskDialogView>();
    const { requirements } = useRequirements(ALL_COHORTS, false);

    const blocker = useMemo(() => {
        return isBlocked(cohort, user, requirement, requirements);
    }, [requirement, requirements, cohort, user]);

    const totalCount = requirement.counts[cohort] || 0;
    const currentCount = getCurrentCount(cohort, requirement, progress);
    const time = formatTime(getTotalTime(cohort, progress));
    const expired = isExpired(requirement, progress);

    let UpdateElement = null;

    switch (requirement.scoreboardDisplay) {
        case ScoreboardDisplay.Hidden:
        case ScoreboardDisplay.Checkbox:
            UpdateElement = (
                <Tooltip title='Update Progress'>
                    <Checkbox
                        aria-label={`Checkbox ${requirement.name}`}
                        checked={currentCount >= totalCount}
                        onClick={() => setTaskDialogView(TaskDialogView.Progress)}
                        disabled={!isCurrentUser}
                    />
                </Tooltip>
            );
            break;

        case ScoreboardDisplay.ProgressBar:
        case ScoreboardDisplay.Minutes:
        case ScoreboardDisplay.Unspecified:
            UpdateElement =
                currentCount >= totalCount ? (
                    <Tooltip title='Update Progress'>
                        <Checkbox
                            checked
                            onClick={() => setTaskDialogView(TaskDialogView.Progress)}
                        />
                    </Tooltip>
                ) : !isCurrentUser ? null : (
                    <Tooltip title='Update Progress'>
                        <IconButton
                            aria-label={`Update ${requirement.name}`}
                            onClick={() => setTaskDialogView(TaskDialogView.Progress)}
                            data-cy='update-task-button'
                        >
                            <AddCircle color='primary' />
                        </IconButton>
                    </Tooltip>
                );
            break;

        case ScoreboardDisplay.NonDojo:
            UpdateElement = (
                <Tooltip title='Update Progress'>
                    <IconButton
                        aria-label={`Update ${requirement.name}`}
                        onClick={() => setTaskDialogView(TaskDialogView.Progress)}
                    >
                        <AddCircle color='primary' />
                    </IconButton>
                </Tooltip>
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
                <Grid2
                    container
                    columnGap={0.5}
                    alignItems='center'
                    justifyContent='space-between'
                    position='relative'
                >
                    <Grid2
                        size={9}
                        onClick={() => setTaskDialogView(TaskDialogView.Details)}
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

                            {displayProgress(requirement) && (
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
                        {displayProgress(requirement) && (
                            <ScoreboardProgress
                                value={currentCount}
                                max={totalCount}
                                min={requirement.startCount || 0}
                                isTime={requirement.scoreboardDisplay === ScoreboardDisplay.Minutes}
                                hideProgressText={true}
                                sx={{ height: '6px' }}
                            />
                        )}
                    </Grid2>
                    <Grid2 size={{ xs: 2, sm: 'auto' }} id='task-status'>
                        <Stack direction='row' alignItems='center' justifyContent='end'>
                            {!blocker.isBlocked && (
                                <Typography
                                    color='text.secondary'
                                    sx={{
                                        display: { xs: 'none', sm: 'initial' },
                                        fontWeight: 'bold',
                                    }}
                                    noWrap
                                    textOverflow='unset'
                                    mr={1}
                                >
                                    {time}
                                </Typography>
                            )}
                            {UpdateElement}

                            {isCurrentUser &&
                                requirement.scoreboardDisplay !== ScoreboardDisplay.Hidden &&
                                requirement.category !== RequirementCategory.Welcome && (
                                    <Tooltip
                                        title={
                                            isPinned
                                                ? 'Unpin from Daily Tasks'
                                                : 'Pin to Daily Tasks'
                                        }
                                    >
                                        <IconButton onClick={() => togglePin(requirement)}>
                                            {isPinned ? (
                                                <PushPin color='dojoOrange' />
                                            ) : (
                                                <PushPinOutlined color='dojoOrange' />
                                            )}
                                        </IconButton>
                                    </Tooltip>
                                )}
                        </Stack>
                    </Grid2>
                </Grid2>
                <Divider />

                {taskDialogView && (
                    <TaskDialog
                        open
                        onClose={() => setTaskDialogView(undefined)}
                        task={requirement}
                        initialView={taskDialogView}
                        progress={progress}
                        cohort={cohort}
                    />
                )}
            </Stack>
        </Tooltip>
    );
};
