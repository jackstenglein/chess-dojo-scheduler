import {
    CustomTask,
    Requirement,
    RequirementCategory,
    RequirementProgress,
    ScoreboardDisplay,
    formatTime,
    getCurrentCount,
    getTotalCount,
} from '@/database/requirement';
import { useTimelineContext } from '@/profile/activity/useTimeline';
import ScoreboardProgress from '@/scoreboard/ScoreboardProgress';
import { CategoryColors } from '@/style/ThemeProvider';
import { AddCircle, PushPin, PushPinOutlined } from '@mui/icons-material';
import {
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

interface TimeframeTrainingPlanItemProps {
    /** The minimum date (inclusive) that the task applies to, in ISO 8601. */
    startDate: string;
    /** The maximum date (exclusive) that the task applies to, in ISO 8601. */
    endDate: string;
    /** The task being displayed. */
    task: Requirement | CustomTask;
    /** The total number of minutes the user should work on the task in the timeframe. */
    goalMinutes: number;
    /** The user's total progress on the task, if it exists. */
    progress?: RequirementProgress;
    /** The cohort the task is being viewed on. */
    cohort: string;
    /** Whether the user is the current signed-in user. */
    isCurrentUser: boolean;
    /** Whether the task is pinned. */
    isPinned: boolean;
    /** A callback invoked when the user toggles pinning the task. */
    togglePin: (req: Requirement | CustomTask) => void;
}

/**
 * Renders a training plan item that corresponds to a specific timeframe.
 */
export const TimeframeTrainingPlanItem = ({
    startDate,
    endDate,
    task,
    goalMinutes,
    progress,
    cohort,
    isCurrentUser,
    togglePin,
    isPinned,
}: TimeframeTrainingPlanItemProps) => {
    const { entries: timeline } = useTimelineContext();
    const timeWorkedMinutes = useMemo(() => {
        let timeWorked = 0;
        for (const entry of timeline) {
            const date = entry.date || entry.createdAt;
            if (entry.requirementId === task.id && date >= startDate && date < endDate) {
                timeWorked += entry.minutesSpent;
            }
        }
        return timeWorked;
    }, [timeline, startDate, endDate, task.id]);

    const [taskDialogView, setTaskDialogView] = useState<TaskDialogView>();

    const totalCount = getTotalCount(cohort, task);
    const currentCount = getCurrentCount(cohort, task, progress);

    const requirementName = (task.dailyName || task.name)
        .replaceAll('{{count}}', `${totalCount}`)
        .replaceAll('{{time}}', formatTime(goalMinutes));

    return (
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
                >
                    <Chip
                        label={task.category}
                        variant='outlined'
                        sx={{
                            color: CategoryColors[task.category],
                            borderColor: CategoryColors[task.category],
                            alignSelf: 'start',
                        }}
                        size='small'
                    />

                    <Typography
                        sx={{
                            fontWeight: 'bold',
                            mt: 1,
                        }}
                    >
                        {requirementName}
                    </Typography>

                    {displayProgress(task) && (
                        <ScoreboardProgress
                            value={currentCount}
                            max={totalCount}
                            min={task.startCount || 0}
                            isTime={task.scoreboardDisplay === ScoreboardDisplay.Minutes}
                            sx={{ height: '6px' }}
                            suffix={task.progressBarSuffix}
                        />
                    )}
                </Grid2>
                <Grid2 size={{ xs: 2, sm: 'auto' }} id='task-status'>
                    <Stack direction='row' alignItems='center' justifyContent='end'>
                        {goalMinutes > 0 && timeWorkedMinutes >= goalMinutes ? (
                            <Checkbox
                                checked
                                onClick={() => setTaskDialogView(TaskDialogView.Progress)}
                                disabled={!isCurrentUser}
                            />
                        ) : !isCurrentUser ? null : (
                            <IconButton
                                aria-label={`Update ${task.name}`}
                                onClick={() => setTaskDialogView(TaskDialogView.Progress)}
                                data-cy='update-task-button'
                            >
                                <AddCircle color='primary' />
                            </IconButton>
                        )}

                        {isCurrentUser &&
                            task.scoreboardDisplay !== ScoreboardDisplay.Hidden &&
                            task.category !== RequirementCategory.Welcome && (
                                <Tooltip
                                    title={
                                        isPinned
                                            ? 'Unpin from Daily Tasks'
                                            : 'Pin to Daily Tasks'
                                    }
                                >
                                    <IconButton onClick={() => togglePin(task)}>
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
                    task={task}
                    initialView={taskDialogView}
                    progress={progress}
                    cohort={cohort}
                    initialTime={goalMinutes - timeWorkedMinutes}
                />
            )}
        </Stack>
    );
};

/**
 * Returns true if the task should display a progress bar.
 * @param task The task to check.
 */
function displayProgress(task: Requirement | CustomTask): boolean {
    switch (task.scoreboardDisplay) {
        case ScoreboardDisplay.Unspecified:
        case ScoreboardDisplay.ProgressBar:
        case ScoreboardDisplay.Minutes:
            return true;
    }
    return false;
}
