import { useAuth } from '@/auth/Auth';
import { formatTime } from '@/database/requirement';
import { CategoryColors } from '@/style/ThemeProvider';
import { Help, NotInterested, PushPin } from '@mui/icons-material';
import {
    Card,
    CardActions,
    CardContent,
    Chip,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { useMemo } from 'react';
import { CircularTimeProgress } from '../CircularTimeProgress';
import { SuggestedTask } from '../suggestedTasks';
import { useWeeklyTrainingPlan } from '../useTrainingPlan';

const days = ['Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat', 'Sun'];

export function WeeklyTrainingPlanSection() {
    const { user } = useAuth();

    const { request, pinnedTasks, togglePin, isCurrentUser, suggestionsByDay, isLoading } =
        useWeeklyTrainingPlan(user!);

    const suggestedTasks = useMemo(() => suggestionsByDay[new Date().getDay()], [suggestionsByDay]);

    return (
        <Stack spacing={2} width={1}>
            <Typography variant='h5' fontWeight='bold'>
                This Week
            </Typography>

            <Stack direction='row' spacing={2} width={1} sx={{ overflowX: 'scroll', pb: 2 }}>
                {days.map((d, i) => (
                    <WeeklyTrainingPlanDay
                        key={i}
                        dayIndex={i}
                        suggestionsByDay={suggestionsByDay}
                    />
                ))}
            </Stack>
        </Stack>
    );
}

function WeeklyTrainingPlanDay({
    suggestionsByDay,
    dayIndex,
}: {
    suggestionsByDay: SuggestedTask[][];
    dayIndex: number;
}) {
    const suggestedTasks = suggestionsByDay[dayIndex];

    return (
        <Stack minWidth='calc((100% - 32px) / 3)' spacing={1}>
            <Typography variant='subtitle1' fontWeight='bold' color='text.secondary'>
                {days[dayIndex]}
            </Typography>
            {suggestedTasks.map((t) => (
                // <Fragment key={t.task.id}>
                <Card key={t.task.id} variant='outlined'>
                    <CardContent sx={{ flexGrow: 1 }}>
                        <Stack spacing={1}>
                            <Chip
                                label={t.task.category}
                                variant='outlined'
                                sx={{
                                    color: CategoryColors[t.task.category],
                                    borderColor: CategoryColors[t.task.category],
                                    alignSelf: 'start',
                                }}
                                size='small'
                            />

                            <Typography variant='h6' fontWeight='bold'>
                                {(t.task.dailyName || t.task.name).replaceAll(
                                    '{{time}}',
                                    formatTime(t.goalMinutes),
                                )}
                            </Typography>
                        </Stack>

                        <Typography color='textSecondary' sx={{ mt: 1 }}>
                            {t.task.description.slice(0, 150)}...
                        </Typography>
                    </CardContent>
                    <CardActions disableSpacing>
                        <Tooltip title='View task details'>
                            <IconButton sx={{ color: 'text.secondary' }}>
                                <Help />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title='Skip task for now'>
                            <IconButton
                                sx={{
                                    color: 'text.secondary',
                                    marginLeft: 'auto',
                                }}
                            >
                                <NotInterested />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title={'Unpin from Daily Tasks'}>
                            <IconButton>
                                <PushPin color='dojoOrange' />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title='Update Progress'>
                            <span style={{ marginRight: '4px' }}>
                                <CircularTimeProgress
                                    data-cy='update-task-button'
                                    value={0}
                                    max={t.goalMinutes}
                                    onClick={() => null}
                                />
                            </span>
                        </Tooltip>
                    </CardActions>
                </Card>
                // </Fragment>
            ))}
        </Stack>
    );
}
