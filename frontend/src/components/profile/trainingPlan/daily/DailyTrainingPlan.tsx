import { RequestSnackbar } from '@/api/Request';
import { getWeeklySuggestedTasks } from '@/database/requirement';
import { User } from '@/database/user';
import { CalendarToday } from '@mui/icons-material';
import { useMemo } from 'react';
import { useTrainingPlan } from '../useTrainingPlan';
import { TimeframeTrainingPlanSection } from './TimeframeTrainingPlanSection';

export function DailyTrainingPlan({ user }: { user: User }) {
    const [startDate, endDate] = useMemo(() => {
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);

        return [startDate.toISOString(), endDate.toISOString()];
    }, []);

    const { request, requirements, pinnedTasks, togglePin, isCurrentUser } =
        useTrainingPlan(user);

    const suggestedTasks = useMemo(() => {
        const suggestionsByDay = getWeeklySuggestedTasks({
            user,
            pinnedTasks,
            requirements,
        });
        return suggestionsByDay[new Date().getDay()];
    }, [pinnedTasks, requirements, user]);

    return (
        <>
            <RequestSnackbar request={request} />

            <TimeframeTrainingPlanSection
                startDate={startDate}
                endDate={endDate}
                title='Today'
                icon={
                    <CalendarToday
                        sx={{ marginRight: '0.6rem', verticalAlign: 'middle' }}
                    />
                }
                user={user}
                isCurrentUser={isCurrentUser}
                tasks={suggestedTasks}
                pinnedTasks={pinnedTasks}
                togglePin={togglePin}
                expanded
            />
        </>
    );
}
