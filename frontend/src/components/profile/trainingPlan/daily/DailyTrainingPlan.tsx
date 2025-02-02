import { RequestSnackbar } from '@/api/Request';
import { formatTime, getSuggestedTasks } from '@/database/requirement';
import { User } from '@/database/user';
import { useTimelineContext } from '@/profile/activity/useTimeline';
import { CalendarToday } from '@mui/icons-material';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    CircularProgress,
    CircularProgressProps,
    Divider,
    Stack,
    Typography,
} from '@mui/material';
import { useMemo } from 'react';
import { getTodaysWorkGoal, useTrainingPlan } from '../useTrainingPlan';
import { DEFAULT_WORK_GOAL } from '../WorkGoalSettingsEditor';
import { TimeframeTrainingPlanItem } from './TimeframeTrainingPlanItem';

export function DailyTrainingPlan({ user }: { user: User }) {
    const { entries: timeline } = useTimelineContext();

    const [startDate, endDate] = useMemo(() => {
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);

        return [startDate.toISOString(), endDate.toISOString()];
    }, []);

    const { request, requirements, pinnedTasks, togglePin, isCurrentUser } =
        useTrainingPlan(user);

    const [suggestedTasks, currentTime, goalTime] = useMemo(() => {
        const tasks = getSuggestedTasks(pinnedTasks, requirements, user);

        const workGoal = user.workGoal || DEFAULT_WORK_GOAL;
        const minutesToday = getTodaysWorkGoal(workGoal);
        const maxTasks = Math.floor(minutesToday / workGoal.minutesPerTask);

        const tasksWithTime = tasks.slice(0, maxTasks);

        const suggestedTasks = tasksWithTime.map((task) => ({
            task,
            goalMinutes: Math.floor(minutesToday / tasksWithTime.length),
        }));
        suggestedTasks.push(
            ...tasks.slice(maxTasks).map((task) => ({ task, goalMinutes: 0 })),
        );

        let timeWorked = 0;
        for (const entry of timeline) {
            const date = entry.date || entry.createdAt;
            if (
                date >= startDate &&
                date < endDate &&
                suggestedTasks.some(
                    ({ task, goalMinutes }) =>
                        goalMinutes > 0 && task.id === entry.requirementId,
                )
            ) {
                timeWorked += entry.minutesSpent;
            }
        }

        return [suggestedTasks, timeWorked, minutesToday];
    }, [pinnedTasks, requirements, user, startDate, endDate, timeline]);

    return (
        <>
            <RequestSnackbar request={request} />

            <Accordion expanded sx={{ width: 1 }}>
                <AccordionSummary component='div' sx={{ cursor: 'unset !important' }}>
                    <Stack
                        direction='row'
                        justifyContent='space-between'
                        alignItems='center'
                        flexWrap='wrap'
                        columnGap='1rem'
                        rowGap={0.5}
                        sx={{ width: 1, mr: 2 }}
                    >
                        <Typography fontWeight='bold'>
                            <CalendarToday
                                sx={{ marginRight: '0.6rem', verticalAlign: 'middle' }}
                            />
                            Today's Tasks
                        </Typography>
                        <CircularProgressWithLabel value={currentTime} max={goalTime} />
                    </Stack>
                </AccordionSummary>
                <AccordionDetails>
                    <Divider />
                    {suggestedTasks.map(({ task, goalMinutes }) => {
                        if (goalMinutes === 0) {
                            return null;
                        }
                        return (
                            <TimeframeTrainingPlanItem
                                key={task.id}
                                startDate={startDate}
                                endDate={endDate}
                                task={task}
                                goalMinutes={goalMinutes}
                                progress={user.progress[task.id]}
                                cohort={user.dojoCohort}
                                isCurrentUser={isCurrentUser}
                                isPinned={pinnedTasks.some((t) => t.id === task.id)}
                                togglePin={togglePin}
                            />
                        );
                    })}
                </AccordionDetails>
            </Accordion>
        </>
    );
}

function CircularProgressWithLabel(
    props: CircularProgressProps & { value: number; max: number },
) {
    return (
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
                variant='determinate'
                value={100}
                sx={{
                    position: 'absolute',
                    color: 'var(--mui-palette-LinearProgress-primaryBg)',
                }}
                size='3.5rem'
            />
            <CircularProgress
                variant='determinate'
                {...props}
                size='3.5rem'
                value={(props.value / props.max) * 100}
            />
            <Box
                sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography
                    variant='caption'
                    component='div'
                    sx={{ color: 'text.secondary' }}
                >
                    {formatTime(props.value)}
                </Typography>
            </Box>
        </Box>
    );
}
