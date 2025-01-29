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
import { useTrainingPlan } from '../useTrainingPlan';
import { TimeframeTrainingPlanItem } from './TimeframeTrainingPlanItem';

export function DailyTrainingPlan({
    user,
    workGoalMinutes,
}: {
    user: User;
    workGoalMinutes: number;
}) {
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
        return getSuggestedTasks(pinnedTasks, requirements, user);
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
                    {suggestedTasks.map((task) => (
                        <TimeframeTrainingPlanItem
                            key={task.id}
                            startDate={startDate}
                            endDate={endDate}
                            task={task}
                            goalMinutes={workGoalMinutes / suggestedTasks.length}
                            progress={user.progress[task.id]}
                            cohort={user.dojoCohort}
                            isCurrentUser={isCurrentUser}
                            isPinned={pinnedTasks.some((t) => t.id === task.id)}
                            togglePin={togglePin}
                        />
                    ))}
                </AccordionDetails>
            </Accordion>
        </>
    );
}
