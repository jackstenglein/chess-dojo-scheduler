import { RequestSnackbar } from '@/api/Request';
import { getSuggestedTasks, RequirementCategory } from '@/database/requirement';
import { User } from '@/database/user';
import { useMemo } from 'react';
import { TrainingPlanSection } from './TrainingPlanSection';
import { useTrainingPlan } from './useTrainingPlan';

export function DailyTrainingPlan({ user }: { user: User }) {
    const { request, requirements, pinnedTasks, togglePin, isCurrentUser } =
        useTrainingPlan(user);

    const suggestedTasks = useMemo(() => {
        return getSuggestedTasks(pinnedTasks, requirements, user);
    }, [pinnedTasks, requirements, user]);

    return (
        <>
            <RequestSnackbar request={request} />
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
                isCurrentUser={isCurrentUser}
                cohort={user.dojoCohort}
                togglePin={togglePin}
                pinnedTasks={pinnedTasks}
            />
        </>
    );
}
