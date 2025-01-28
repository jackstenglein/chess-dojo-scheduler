import { useApi } from '@/api/Api';
import { useRequirements } from '@/api/cache/requirements';
import { useAuth } from '@/auth/Auth';
import { CustomTask, Requirement } from '@/database/requirement';
import { ALL_COHORTS, User } from '@/database/user';
import { useMemo } from 'react';

/**
 * Returns common data and functions used across all Training Plan tabs.
 * @param user The user to display the training plan for.
 * @param cohort The cohort to display the training plan for.
 */
export function useTrainingPlan(user: User, cohort?: string) {
    const { user: currentUser, updateUser } = useAuth();
    const api = useApi();
    const { request } = useRequirements(ALL_COHORTS, false);
    const { requirements } = useRequirements(cohort || user.dojoCohort, false);
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

    const togglePin = (task: Requirement | CustomTask) => {
        const isPinned = pinnedTasks.some((t) => t.id === task.id);
        const newPinnedTasks = isPinned
            ? pinnedTasks.filter((t) => t.id !== task.id)
            : [...pinnedTasks, task];
        const newIds = newPinnedTasks.map((t) => t.id);

        updateUser({ pinnedTasks: newIds });
        api.updateUser({ pinnedTasks: newIds }).catch(console.error);
    };

    return {
        request,
        requirements,
        pinnedTasks,
        togglePin,
        isCurrentUser: currentUser?.username === user.username,
    };
}
