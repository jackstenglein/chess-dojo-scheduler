import {
    TrainingPlanView,
    TrainingPlanViewSelect,
} from '@/components/profile/trainingPlan/TrainingPlanViewSelect';
import { User } from '@/database/user';
import { Box, Stack, Typography } from '@mui/material';
import { useLocalStorage } from 'usehooks-ts';
import { DailyTrainingPlan } from './daily/DailyTrainingPlan';
import { FullTrainingPlan } from './full/FullTrainingPlan';
import { WorkGoalSettingsEditor } from './WorkGoalSettingsEditor';

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

    return (
        <Stack alignItems='start' mb={6}>
            <Box sx={{ mb: 2 }}>
                <TrainingPlanViewSelect
                    value={trainingPlanView}
                    onChange={setTrainingPlanView}
                />
            </Box>

            {trainingPlanView !== TrainingPlanView.Full && (
                <WorkGoalSettingsEditor
                    initialWeekStart={user.weekStart}
                    workGoal={user.workGoal}
                    disabled={!isCurrentUser}
                    view={trainingPlanView}
                />
            )}

            {trainingPlanView === TrainingPlanView.Daily && (
                <DailyTrainingPlan user={user} />
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
