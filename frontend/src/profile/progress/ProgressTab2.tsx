import { useRequirements } from '@/api/cache/requirements';
import { FullTrainingPlan } from '@/components/profile/trainingPlan/FullTrainingPlan';
import { TrainingPlanSection } from '@/components/profile/trainingPlan/TrainingPlanSection';
import {
    TrainingPlanView,
    TrainingPlanViewSelect,
} from '@/components/profile/trainingPlan/TrainingPlanViewSelect';
import { getSuggestedTasks, RequirementCategory } from '@/database/requirement';
import { ALL_COHORTS, User } from '@/database/user';
import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useLocalStorage } from 'usehooks-ts';

const TRAINING_PLAN_VIEW = {
    Key: 'trainingPlanView',
    Default: TrainingPlanView.Daily,
};

export function ProgressTab2({
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
    const { request: requirementRequest } = useRequirements(ALL_COHORTS, false);
    const { requirements } = useRequirements(user.dojoCohort, false);
    const pinnedTasks = useMemo(() => {
        return (
            user.pinnedTasks
                ?.map(
                    (id) =>
                        user.customTasks?.find((task) => task.id === id) ||
                        requirements.find((task) => task.id === id),
                )
                .filter((t) => !!t) ?? []
        );
    }, [user, requirements]);

    const suggestedTasks = useMemo(() => {
        return getSuggestedTasks(pinnedTasks, requirements, user);
    }, [pinnedTasks, requirements, user]);

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
                <TrainingPlanSection
                    section={{
                        category: "Today's Tasks" as RequirementCategory,
                        tasks: suggestedTasks,
                        complete: 0,
                        total: suggestedTasks.length,
                    }}
                    expanded={true}
                    toggleExpand={() => null}
                    user={user}
                    isCurrentUser={true}
                    cohort={user.dojoCohort}
                    togglePin={() => null}
                    pinnedTasks={pinnedTasks}
                />
            )}

            {trainingPlanView === TrainingPlanView.Weekly && (
                <Typography>Not available in beta yet</Typography>
            )}

            {trainingPlanView === TrainingPlanView.Monthly && (
                <Typography>Not available in beta yet</Typography>
            )}

            {trainingPlanView === TrainingPlanView.Full && (
                <FullTrainingPlan user={user} isCurrentUser={isCurrentUser} />
            )}
        </Stack>
    );
}
