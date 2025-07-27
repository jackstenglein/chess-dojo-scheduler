import { TrainingPlanView } from '@/components/profile/trainingPlan/TrainingPlanViewSelect';
import { User } from '@/database/user';
import { Stack, Typography } from '@mui/material';
import { useLocalStorage } from 'usehooks-ts';
import { DailyTrainingPlan } from './daily/DailyTrainingPlan';
import { FullTrainingPlan } from './full/FullTrainingPlan';
import { WeeklyTrainingPlanSection } from './weekly/WeeklyTrainingPlanSection';

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

            <Stack spacing={2} width={1}>
                <Typography variant='h5' fontWeight='bold'>
                    Today
                </Typography>
                <DailyTrainingPlan user={user} />
            </Stack>

            <WeeklyTrainingPlanSection />

            <Stack spacing={2} width={1}>
                <Typography variant='h5' fontWeight='bold'>
                    Full Training Plan
                </Typography>

                <FullTrainingPlan user={user} />
            </Stack>

            {/* {trainingPlanView === TrainingPlanView.Daily && <DailyTrainingPlan user={user} />}

            {trainingPlanView === TrainingPlanView.Weekly && <WeeklyTrainingPlan user={user} />}

            {trainingPlanView === TrainingPlanView.Full && <FullTrainingPlan user={user} />} */}
        </Stack>
    );
}
