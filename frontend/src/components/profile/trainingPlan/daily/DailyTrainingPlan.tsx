import { RequestSnackbar } from '@/api/Request';
import { formatTime } from '@/database/requirement';
import { User } from '@/database/user';
import LoadingPage from '@/loading/LoadingPage';
import { CategoryColors } from '@/style/ThemeProvider';
import { Help, NotInterested, PushPin } from '@mui/icons-material';
import {
    Card,
    CardActions,
    CardContent,
    Chip,
    Grid,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { useMemo } from 'react';
import { CircularTimeProgress } from '../CircularTimeProgress';
import { useWeeklyTrainingPlan } from '../useTrainingPlan';

export function DailyTrainingPlan({ user }: { user: User }) {
    const [startDate, endDate] = useMemo(() => {
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);

        return [startDate.toISOString(), endDate.toISOString()];
    }, []);

    const { request, pinnedTasks, togglePin, isCurrentUser, suggestionsByDay, isLoading } =
        useWeeklyTrainingPlan(user);

    const suggestedTasks = useMemo(() => suggestionsByDay[new Date().getDay()], [suggestionsByDay]);

    return (
        <>
            <RequestSnackbar request={request} />

            {isLoading ? (
                <Stack width={1} alignItems='center' justifyContent='center'>
                    <LoadingPage />
                </Stack>
            ) : (
                <>
                    <Stack width={1}>
                        <Grid container sx={{ width: 1 }} columnSpacing={2}>
                            {suggestedTasks.map((t) => (
                                <Grid key={t.task.id} size={{ xs: 12, md: 4 }}>
                                    <Card
                                        variant='outlined'
                                        sx={{ height: 1, display: 'flex', flexDirection: 'column' }}
                                    >
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            <Stack spacing={1}>
                                                <Chip
                                                    label={t.task.category}
                                                    variant='outlined'
                                                    sx={{
                                                        color: CategoryColors[t.task.category],
                                                        borderColor:
                                                            CategoryColors[t.task.category],
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
                                </Grid>
                            ))}
                        </Grid>
                    </Stack>

                    {/* <TimeframeTrainingPlanSection
                        startDate={startDate}
                        endDate={endDate}
                        title='Today'
                        icon={
                            <CalendarToday
                                sx={{ marginRight: '0.6rem', verticalAlign: 'middle' }}
                            />
                        }
                        user={user}
                        isCurrentUser={isCurrentUser}
                        tasks={suggestedTasks}
                        pinnedTasks={pinnedTasks}
                        togglePin={togglePin}
                        expanded
                    /> */}
                </>
            )}
        </>
    );
}
