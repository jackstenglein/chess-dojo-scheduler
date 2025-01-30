import {
    TrainingPlanView,
    TrainingPlanViewSelect,
} from '@/components/profile/trainingPlan/TrainingPlanViewSelect';
import { User } from '@/database/user';
import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { DailyTrainingPlan } from './daily/DailyTrainingPlan';
import { FullTrainingPlan } from './full/FullTrainingPlan';
import { WorkGoalSettings } from './WorkGoalSettings';

const TRAINING_PLAN_VIEW = {
    Key: 'trainingPlanView',
    Default: TrainingPlanView.Daily,
};

export function TrainingPlanTab({
    user,
    isCurrentUser,
}: {
    user: User;
    isCurrentUser: boolean;
}) {
    const [trainingPlanView, setTrainingPlanView] = useLocalStorage(
        TRAINING_PLAN_VIEW.Key,
        TRAINING_PLAN_VIEW.Default,
    );
    const [workGoalMinutes, setWorkGoalMinutes] = useState(60);

    return (
        <Stack alignItems='start' mb={6}>
            <Stack direction='row' alignItems='center' width={1} gap={1} sx={{ mb: 3 }}>
                <TextField
                    disabled={!isCurrentUser}
                    select
                    label='Work Goal'
                    value={workGoalMinutes}
                    onChange={(e) => setWorkGoalMinutes(parseInt(e.target.value))}
                    fullWidth
                >
                    <MenuItem value={60}>1 hour / day</MenuItem>
                    <MenuItem value={120}>2 hours / day</MenuItem>
                    <MenuItem value={180}>3 hours / day</MenuItem>
                    <MenuItem value={240}>4 hours / day</MenuItem>
                </TextField>

                {isCurrentUser && <WorkGoalSettings />}
            </Stack>

            <Box sx={{ mb: 4 }}>
                <TrainingPlanViewSelect
                    value={trainingPlanView}
                    onChange={setTrainingPlanView}
                />
            </Box>

            {trainingPlanView === TrainingPlanView.Daily && (
                <DailyTrainingPlan user={user} workGoalMinutes={workGoalMinutes} />
            )}

            {trainingPlanView === TrainingPlanView.Weekly && (
                <Typography>Not available in beta yet</Typography>
            )}

            {trainingPlanView === TrainingPlanView.Full && (
                <FullTrainingPlan user={user} />
            )}
        </Stack>
    );
}
