import { FullTrainingPlan } from '@/components/profile/trainingPlan/FullTrainingPlan';
import {
    TrainingPlanView,
    TrainingPlanViewSelect,
} from '@/components/profile/trainingPlan/TrainingPlanViewSelect';
import { User } from '@/database/user';
import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useLocalStorage } from 'usehooks-ts';
import { DailyTrainingPlan } from './DailyTrainingPlan';

const TRAINING_PLAN_VIEW = {
    Key: 'trainingPlanView',
    Default: TrainingPlanView.Daily,
};

export function TrainingPlanTab({ user }: { user: User }) {
    const [trainingPlanView, setTrainingPlanView] = useLocalStorage(
        TRAINING_PLAN_VIEW.Key,
        TRAINING_PLAN_VIEW.Default,
    );

    return (
        <Stack alignItems='start' mb={6}>
            <TextField select label='Work Goal' value='3' fullWidth sx={{ mb: 3 }}>
                <MenuItem value='1'>1 hour / day</MenuItem>
                <MenuItem value='2'>2 hours / day</MenuItem>
                <MenuItem value='3'>3 hours / day</MenuItem>
                <MenuItem value='4'>4 hours / day</MenuItem>
            </TextField>

            <Box sx={{ mb: 4 }}>
                <TrainingPlanViewSelect
                    value={trainingPlanView}
                    onChange={setTrainingPlanView}
                />
            </Box>

            {trainingPlanView === TrainingPlanView.Daily && (
                <DailyTrainingPlan user={user} />
            )}

            {trainingPlanView === TrainingPlanView.Weekly && (
                <Typography>Not available in beta yet</Typography>
            )}

            {trainingPlanView === TrainingPlanView.Monthly && (
                <Typography>Not available in beta yet</Typography>
            )}

            {trainingPlanView === TrainingPlanView.Full && (
                <FullTrainingPlan user={user} />
            )}
        </Stack>
    );
}
