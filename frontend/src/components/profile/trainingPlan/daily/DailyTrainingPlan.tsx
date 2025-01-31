import { RequestSnackbar } from '@/api/Request';
import { getSuggestedTasks } from '@/database/requirement';
import { User } from '@/database/user';
import { ProgressText } from '@/scoreboard/ScoreboardProgress';
import { CalendarToday } from '@mui/icons-material';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Divider,
    Stack,
    Typography,
} from '@mui/material';
import { useMemo } from 'react';
import { getTodaysWorkGoal, useTrainingPlan } from '../useTrainingPlan';
import { DEFAULT_WORK_GOAL } from '../WorkGoalSettingsEditor';
import { TimeframeTrainingPlanItem } from './TimeframeTrainingPlanItem';

export function DailyTrainingPlan({ user }: { user: User }) {
    const [startDate, endDate] = useMemo(() => {
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);

        return [startDate.toISOString(), endDate.toISOString()];
    }, []);

    const { request, requirements, pinnedTasks, togglePin, isCurrentUser } =
        useTrainingPlan(user);

    const suggestedTasks = useMemo(() => {
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

        return suggestedTasks;
    }, [pinnedTasks, requirements, user]);

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
                        <ProgressText
                            value={0}
                            max={suggestedTasks.length}
                            min={0}
                            suffix='Tasks'
                        />
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
