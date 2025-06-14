import { TrainingPlanView } from '@/components/profile/trainingPlan/TrainingPlanViewSelect';
import { User } from '@/database/user';
import { Stack } from '@mui/material';
import { useLocalStorage } from 'usehooks-ts';
import { DailyTrainingPlan } from './daily/DailyTrainingPlan';
import { FullTrainingPlan } from './full/FullTrainingPlan';

const TRAINING_PLAN_VIEW = {
    Key: 'trainingPlanView',
    Default: TrainingPlanView.Weekly,
};

export function TrainingPlanTab({ user, isCurrentUser }: { user: User; isCurrentUser: boolean }) {
    const [trainingPlanView, setTrainingPlanView] = useLocalStorage(
        TRAINING_PLAN_VIEW.Key,
        TRAINING_PLAN_VIEW.Default,
    );

    return (
        <Stack alignItems='start' mb={6} spacing={6}>
            {/* <Box sx={{ mb: 2 }}>
                <TrainingPlanViewSelect value={trainingPlanView} onChange={setTrainingPlanView} />
            </Box>

            {trainingPlanView !== TrainingPlanView.Full && (
                <WorkGoalSettingsEditor
                    initialWeekStart={user.weekStart}
                    workGoal={user.workGoal}
                    disabled={!isCurrentUser}
                    view={trainingPlanView}
                />
            )} */}

            <DailyTrainingPlan user={user} />

            <FullTrainingPlan user={user} />

            {/* {trainingPlanView === TrainingPlanView.Daily && <DailyTrainingPlan user={user} />}

            {trainingPlanView === TrainingPlanView.Weekly && <WeeklyTrainingPlan user={user} />}

            {trainingPlanView === TrainingPlanView.Full && <FullTrainingPlan user={user} />} */}
        </Stack>
    );
}
