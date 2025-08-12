import { RequestSnackbar } from '@/api/Request';
import { User } from '@/database/user';
import { Stack, Typography, useMediaQuery } from '@mui/material';
import { createContext } from 'react';
import { DailyTrainingPlanSection } from './daily/DailyTrainingPlan';
import { FullTrainingPlan } from './full/FullTrainingPlan';
import { useWeeklyTrainingPlan, UseWeeklyTrainingPlanResponse } from './useTrainingPlan';
import { WeeklyTrainingPlanSection } from './weekly/WeeklyTrainingPlanSection';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const TrainingPlanContext = createContext<UseWeeklyTrainingPlanResponse>(null!);

export function TrainingPlanTab({ user }: { user: User }) {
    const hideWeekly = useMediaQuery((theme) => theme.breakpoints.down('sm'));
    const trainingPlan = useWeeklyTrainingPlan(user);

    return (
        <Stack alignItems='start' mb={6} spacing={6}>
            <RequestSnackbar request={trainingPlan.request} />

            <TrainingPlanContext value={trainingPlan}>
                <DailyTrainingPlanSection />

                {!hideWeekly && <WeeklyTrainingPlanSection />}

                <Stack spacing={2} width={1}>
                    <Typography variant='h5' fontWeight='bold'>
                        Full Training Plan
                    </Typography>

                    <FullTrainingPlan user={user} />
                </Stack>
            </TrainingPlanContext>
        </Stack>
    );
}
