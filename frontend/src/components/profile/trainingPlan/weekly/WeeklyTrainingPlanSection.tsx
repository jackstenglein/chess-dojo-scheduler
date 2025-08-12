import { CustomTask, Requirement } from '@/database/requirement';
import LoadingPage from '@/loading/LoadingPage';
import { CategoryColors, themeRequirementCategory } from '@/style/ThemeProvider';
import { displayRequirementCategoryShort } from '@jackstenglein/chess-dojo-common/src/database/requirement';
import { Check } from '@mui/icons-material';
import { alpha, Box, ButtonBase, Card, Chip, Grid, Stack, Typography } from '@mui/material';
import { use, useState } from 'react';
import { taskTitle } from '../daily/DailyTrainingPlan';
import { SuggestedTask } from '../suggestedTasks';
import { TaskDialog, TaskDialogView } from '../TaskDialog';
import { TimeProgressChip } from '../TimeProgressChip';
import { TrainingPlanContext } from '../TrainingPlanTab';
import { useTrainingPlanProgress } from '../useTrainingPlan';
import { WorkGoalSettingsEditor } from '../WorkGoalSettingsEditor';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];

export function WeeklyTrainingPlanSection() {
    const { startDate, endDate, weekSuggestions, timeline, isCurrentUser, isLoading, user } =
        use(TrainingPlanContext);

    const [goalTime, workedTime] = useTrainingPlanProgress({
        startDate,
        endDate,
        tasks: weekSuggestions,
        timeline,
    });

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
        <Stack spacing={2} width={1}>
            <Stack direction='row' alignItems='center' spacing={2}>
                <Typography variant='h5' fontWeight='bold'>
                    This Week
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
                <Grid container columns={7}>
                    {days.map((_, i) => (
                        <Grid key={i} size={1}>
                            <WeeklyTrainingPlanDay
                                dayIndex={(i + user.weekStart) % 7}
                                onOpenTask={onOpenTask}
                            />
                        </Grid>
                    ))}
                </Grid>
            )}

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
        </Stack>
    );
}

function WeeklyTrainingPlanDay({
    dayIndex,
    onOpenTask,
}: {
    dayIndex: number;
    onOpenTask: (task: Requirement | CustomTask, view: TaskDialogView) => void;
}) {
    const { suggestionsByDay } = use(TrainingPlanContext);
    const suggestedTasks = suggestionsByDay[dayIndex];
    const todayIndex = new Date().getDay();

    return (
        <Stack height={1}>
            <Typography
                variant='subtitle1'
                fontWeight='bold'
                color={todayIndex === dayIndex ? 'primary' : 'text.secondary'}
            >
                {days[dayIndex]}
            </Typography>

            <Card
                sx={{
                    flexGrow: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderLeft: dayIndex === 0 ? undefined : 'none',
                }}
            >
                <Stack spacing={1} py={1} px={0.5}>
                    {suggestedTasks.map((t) => (
                        <WeeklyTrainingPlanItem
                            key={t.task.id}
                            suggestion={t}
                            onOpenTask={onOpenTask}
                        />
                    ))}
                </Stack>
            </Card>
        </Stack>
    );
}

function WeeklyTrainingPlanItem({
    suggestion,
    onOpenTask,
}: {
    suggestion: SuggestedTask;
    onOpenTask: (task: Requirement | CustomTask, view: TaskDialogView) => void;
}) {
    const { task, goalMinutes } = suggestion;
    if (goalMinutes === 0) {
        return null;
    }

    const { isCurrentUser, user } = use(TrainingPlanContext);

    const onOpenProgress = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        onOpenTask(task, TaskDialogView.Progress);
    };

    return (
        <Stack
            direction='row'
            sx={{
                borderRadius: 1.5,
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <Box
                sx={{
                    minWidth: '4px',
                    minHeight: 1,
                    backgroundColor: CategoryColors[task.category],
                }}
            />
            <ButtonBase
                onClick={() => onOpenTask(task, TaskDialogView.Details)}
                sx={{
                    flexGrow: 1,
                    px: 0.5,
                    py: 1,
                    textAlign: 'start',
                    backgroundColor: alpha(CategoryColors[task.category], 0.2),
                    '&:hover:not(:has(#time-progress-chip:hover))': {
                        backgroundColor: alpha(CategoryColors[task.category], 0.13),
                    },
                }}
            >
                <Stack spacing={3} width={1}>
                    <Typography variant='body2' fontWeight='bold'>
                        {taskTitle({ task, cohort: user.dojoCohort, goalMinutes })}
                    </Typography>

                    <Stack direction='row' flexWrap='wrap' gap={1}>
                        <Chip
                            label={displayRequirementCategoryShort(task.category)}
                            color={themeRequirementCategory(task.category)}
                            size='small'
                            sx={{
                                fontSize: '0.75rem',
                                height: 'auto',
                                '& .MuiChip-label': {
                                    px: 0.5,
                                },
                            }}
                        />

                        <TimeProgressChip
                            goal={goalMinutes}
                            value={0}
                            slotProps={{
                                container: {
                                    id: 'time-progress-chip',
                                },
                                chip: {
                                    size: 'small',
                                    icon:
                                        0 >= goalMinutes ? (
                                            <Check fontSize='inherit' color='success' />
                                        ) : undefined,
                                    onClick: isCurrentUser ? onOpenProgress : undefined,
                                    sx: {
                                        fontSize: '0.75rem',
                                        height: 'auto',
                                        '& .MuiChip-label': {
                                            px: 0.5,
                                        },
                                    },
                                },
                            }}
                        />
                    </Stack>
                </Stack>
            </ButtonBase>
        </Stack>
    );
}
