import {
    CustomTask,
    formatTime,
    getTotalCount,
    isRequirement,
    Requirement,
} from '@/database/requirement';
import LoadingPage from '@/loading/LoadingPage';
import { themeRequirementCategory } from '@/style/ThemeProvider';
import { displayRequirementCategory } from '@jackstenglein/chess-dojo-common/src/database/requirement';
import { Check, Help, NotInterested, PushPin, PushPinOutlined } from '@mui/icons-material';
import {
    Card,
    CardActionArea,
    CardActions,
    CardContent,
    Chip,
    Grid,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { use, useMemo, useState } from 'react';
import { TaskDialog, TaskDialogView } from '../TaskDialog';
import { TimeProgressChip } from '../TimeProgressChip';
import { TrainingPlanContext } from '../TrainingPlanTab';
import { useTrainingPlanProgress } from '../useTrainingPlan';
import { WorkGoalSettingsEditor } from '../WorkGoalSettingsEditor';

export function DailyTrainingPlan() {
    const [startDate, endDate] = useMemo(() => {
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);

        return [startDate.toISOString(), endDate.toISOString()];
    }, []);

    const { suggestionsByDay, isCurrentUser, timeline, isLoading, user } = use(TrainingPlanContext);

    const [goalTime, workedTime] = useTrainingPlanProgress({
        startDate,
        endDate,
        tasks: suggestionsByDay[new Date().getDay()],
        timeline,
    });

    return (
        <Stack spacing={2} width={1}>
            <Stack direction='row' alignItems='center' spacing={2}>
                <Typography variant='h5' fontWeight='bold'>
                    Today
                </Typography>

                <WorkGoalSettingsEditor
                    currentGoal={goalTime}
                    currentValue={workedTime}
                    disabled={!isCurrentUser}
                    initialWeekStart={user.weekStart}
                    workGoal={user.workGoal}
                />
            </Stack>

            {isLoading ? (
                <LoadingPage />
            ) : (
                <DailyTrainingPlanInternal startDate={startDate} endDate={endDate} />
            )}
        </Stack>
    );
}

function DailyTrainingPlanInternal({ startDate, endDate }: { startDate: string; endDate: string }) {
    const { suggestionsByDay, user } = use(TrainingPlanContext);
    const suggestedTasks = useMemo(() => suggestionsByDay[new Date().getDay()], [suggestionsByDay]);
    const [selectedTask, setSelectedTask] = useState<Requirement | CustomTask>();
    const [taskDialogView, setTaskDialogView] = useState<TaskDialogView>();

    const onOpenTask = (task: Requirement | CustomTask, view: TaskDialogView) => {
        setSelectedTask(task);
        setTaskDialogView(view);
    };

    const onCloseTask = () => {
        setSelectedTask(undefined);
        setTaskDialogView(undefined);
    };

    return (
        <Stack width={1}>
            {taskDialogView && selectedTask && (
                <TaskDialog
                    open
                    onClose={onCloseTask}
                    task={selectedTask}
                    initialView={taskDialogView}
                    progress={user.progress[selectedTask.id]}
                    cohort={user.dojoCohort}
                />
            )}

            <Grid container sx={{ width: 1 }} columnSpacing={2}>
                {suggestedTasks.map((t) => (
                    <DailyTrainingPlanItem
                        key={t.task.id}
                        task={t.task}
                        goalMinutes={t.goalMinutes}
                        onOpenTask={onOpenTask}
                        startDate={startDate}
                        endDate={endDate}
                    />
                ))}
            </Grid>
        </Stack>
    );
}

function DailyTrainingPlanItem({
    task,
    goalMinutes,
    startDate,
    endDate,
    onOpenTask,
}: {
    task: Requirement | CustomTask;
    goalMinutes: number;
    startDate: string;
    endDate: string;
    onOpenTask: (task: Requirement | CustomTask, view: TaskDialogView) => void;
}) {
    const { isCurrentUser, pinnedTasks, togglePin, timeline, user } = use(TrainingPlanContext);
    const isPinned = pinnedTasks.some((t) => t.id === task.id);

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

    if (goalMinutes === 0) {
        return null;
    }

    return (
        <Grid key={task.id} size={{ xs: 12, md: 4 }}>
            <Card variant='outlined' sx={{ height: 1, display: 'flex', flexDirection: 'column' }}>
                <CardActionArea
                    sx={{ flexGrow: 1 }}
                    onClick={() => onOpenTask(task, TaskDialogView.Details)}
                >
                    <CardContent sx={{ height: 1 }}>
                        <Stack spacing={1} alignItems='start'>
                            <Chip
                                variant='outlined'
                                label={displayRequirementCategory(task.category)}
                                color={themeRequirementCategory(task.category)}
                                size='small'
                            />

                            <Typography variant='h6' fontWeight='bold'>
                                {taskTitle({ task, cohort: user.dojoCohort, goalMinutes })}
                            </Typography>
                        </Stack>

                        {task.description && (
                            <Typography
                                color='textSecondary'
                                sx={{
                                    mt: 1,
                                    lineClamp: 4,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 4,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {task.description}
                            </Typography>
                        )}
                    </CardContent>
                </CardActionArea>
                <CardActions disableSpacing>
                    <Tooltip title='View task details'>
                        <IconButton
                            sx={{ color: 'text.secondary' }}
                            onClick={() => onOpenTask(task, TaskDialogView.Details)}
                        >
                            <Help />
                        </IconButton>
                    </Tooltip>

                    {isCurrentUser && (
                        <>
                            <Tooltip title='Skip for the next week (not implemented)'>
                                <IconButton
                                    sx={{
                                        color: 'text.secondary',
                                        marginLeft: 'auto',
                                    }}
                                >
                                    <NotInterested />
                                </IconButton>
                            </Tooltip>

                            <Tooltip
                                title={isPinned ? 'Unpin from Daily Tasks' : 'Pin to Daily Tasks'}
                            >
                                <IconButton onClick={() => togglePin(task)}>
                                    {isPinned ? (
                                        <PushPin color='dojoOrange' />
                                    ) : (
                                        <PushPinOutlined color='dojoOrange' />
                                    )}
                                </IconButton>
                            </Tooltip>
                        </>
                    )}

                    <Tooltip title={isCurrentUser ? 'Update Progress' : ''}>
                        <TimeProgressChip
                            value={timeWorkedMinutes}
                            goal={goalMinutes}
                            slotProps={{
                                chip: {
                                    icon:
                                        timeWorkedMinutes >= goalMinutes ? (
                                            <Check fontSize='inherit' color='success' />
                                        ) : undefined,
                                    onClick: isCurrentUser
                                        ? () => onOpenTask(task, TaskDialogView.Progress)
                                        : undefined,
                                },
                                container: { marginRight: 0.5 },
                            }}
                        />
                    </Tooltip>
                </CardActions>
            </Card>
        </Grid>
    );
}

/**
 * Returns the title for a task.
 * @param task The task to get the title for.
 * @param cohort The cohort to get the title for.
 * @param goalMinutes The number of minutes to work on the task.
 * @returns The title for the task.
 */
export function taskTitle({
    task,
    cohort,
    goalMinutes,
}: {
    task: Requirement | CustomTask;
    cohort: string;
    goalMinutes: number;
}) {
    const totalCount = getTotalCount(cohort, task, true);

    let title = goalMinutes > 0 ? task.dailyName : task.name;
    title = (title || task.name)
        .replaceAll('{{count}}', `${totalCount}`)
        .replaceAll('{{time}}', formatTime(goalMinutes));

    if (!isRequirement(task) && goalMinutes > 0) {
        title += ` - ${formatTime(goalMinutes)}`;
    }

    return title;
}
