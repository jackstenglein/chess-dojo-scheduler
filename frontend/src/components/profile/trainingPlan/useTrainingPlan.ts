import { useApi } from '@/api/Api';
import { useRequirements } from '@/api/cache/requirements';
import { useAuth } from '@/auth/Auth';
import { CustomTask, Requirement } from '@/database/requirement';
import { ALL_COHORTS, User, WeeklyPlan, WorkGoalSettings } from '@/database/user';
import { useEffect, useMemo } from 'react';
import { useTimelineContext } from '../activity/useTimeline';
import { SuggestedTask, TaskSuggestionAlgorithm } from './suggestedTasks';

/**
 * Returns common data and functions used across all Training Plan tabs.
 * @param user The user to display the training plan for.
 * @param cohort The cohort to display the training plan for.
 */
export function useTrainingPlan(user: User, cohort?: string) {
    const { user: currentUser, updateUser } = useAuth();
    const api = useApi();
    const { request, requirements: allRequirements } = useRequirements(ALL_COHORTS, false);
    const { requirements } = useRequirements(cohort || user.dojoCohort, false);
    const pinnedTasks = useMemo(() => {
        return (
            user.pinnedTasks
                ?.map(
                    (id) =>
                        user.customTasks?.find((task) => task.id === id) ||
                        allRequirements.find((task) => task.id === id),
                )
                .filter((t) => !!t) ?? []
        );
    }, [user, allRequirements]);

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
        allRequirements,
        pinnedTasks,
        togglePin,
        isCurrentUser: currentUser?.username === user.username,
    };
}

export function useWeeklyTrainingPlan(user: User) {
    const api = useApi();
    const trainingPlan = useTrainingPlan(user);
    const { pinnedTasks, requirements, allRequirements, isCurrentUser } = trainingPlan;
    const { entries: timeline } = useTimelineContext();

    const { suggestionsByDay, weekSuggestions, endDate, progressUpdatedAt, nextGame } =
        useMemo(() => {
            const result = new TaskSuggestionAlgorithm(
                user,
                requirements,
                allRequirements,
                timeline,
            ).getWeeklySuggestions();

            const weekSuggestions: SuggestedTask[] = [];
            for (const day of result.suggestionsByDay) {
                for (const suggestion of day) {
                    const existing = weekSuggestions.find((s) => s.task.id === suggestion.task.id);
                    if (existing) {
                        existing.goalMinutes += suggestion.goalMinutes;
                    } else {
                        weekSuggestions.push({ ...suggestion });
                    }
                }
            }

            return { ...result, weekSuggestions };
        }, [user, requirements, allRequirements, timeline]);

    const savedPlan = user.weeklyPlan;
    const isLoading = requirements.length === 0;
    useEffect(() => {
        if (
            !isCurrentUser ||
            equalPlans(savedPlan, {
                suggestionsByDay,
                endDate,
                progressUpdatedAt,
                pinnedTasks: pinnedTasks.map((t) => t.id),
                nextGame,
            }) ||
            isEmpty(suggestionsByDay) ||
            isLoading
        ) {
            return;
        }

        api.updateUser({
            weeklyPlan: {
                endDate,
                tasks: suggestionsByDay.map((day) =>
                    day.map((suggestion) => ({
                        id: suggestion.task.id,
                        minutes: suggestion.goalMinutes,
                    })),
                ),
                progressUpdatedAt,
                pinnedTasks: pinnedTasks.map((t) => t.id),
                nextGame,
            },
        }).catch((err) => console.error('save weekly plan: ', err));
    }, [
        isCurrentUser,
        savedPlan,
        suggestionsByDay,
        endDate,
        progressUpdatedAt,
        pinnedTasks,
        nextGame,
        api,
        isLoading,
    ]);

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7);

    return {
        ...trainingPlan,
        suggestionsByDay,
        weekSuggestions,
        endDate,
        startDate: startDate.toISOString(),
        isLoading,
    };
}

/**
 * Returns the number of minutes the user is expected to work today.
 * @param workGoal The work goal settings of the user.
 */
export function getTodaysWorkGoal(workGoal: WorkGoalSettings): number {
    const dayIndex = new Date().getDay();
    return workGoal.minutesPerDay[dayIndex];
}

/**
 * Returns true if the given saved plan is equivalent to the given new plan.
 * @param savedPlan The saved weekly plan to check.
 * @param newPlan The new plan to check.
 */
function equalPlans(
    savedPlan: WeeklyPlan | undefined,
    newPlan: {
        suggestionsByDay: SuggestedTask[][];
        endDate: string;
        progressUpdatedAt: string;
        pinnedTasks: string[];
        nextGame: string;
    },
) {
    if (!savedPlan) {
        return false;
    }
    if (savedPlan.endDate !== newPlan.endDate) {
        return false;
    }
    if (savedPlan.progressUpdatedAt !== newPlan.progressUpdatedAt) {
        return false;
    }
    if (savedPlan.nextGame !== newPlan.nextGame) {
        return false;
    }
    for (let i = 0; i < newPlan.pinnedTasks.length; i++) {
        if (savedPlan.pinnedTasks?.[i] !== newPlan.pinnedTasks[i]) {
            return false;
        }
    }
    for (let i = 0; i < savedPlan.tasks.length; i++) {
        const savedTasks = savedPlan.tasks[i];
        const newTasks = newPlan.suggestionsByDay[i];
        if (savedTasks.length !== newTasks.length) {
            return false;
        }
        for (let j = 0; j < savedTasks.length; j++) {
            if (
                savedTasks[j].id !== newTasks[j].task.id ||
                savedTasks[j].minutes !== newTasks[j].goalMinutes
            ) {
                return false;
            }
        }
    }
    return true;
}

function isEmpty(suggestionsByDay: SuggestedTask[][]) {
    return suggestionsByDay.every((day) => day.length === 0);
}
