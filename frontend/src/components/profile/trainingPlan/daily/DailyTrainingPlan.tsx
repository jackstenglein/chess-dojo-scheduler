import { RequestSnackbar } from '@/api/Request';
import { User } from '@/database/user';
import { CalendarToday } from '@mui/icons-material';
import { useMemo } from 'react';
import { useWeeklyTrainingPlan } from '../useTrainingPlan';
import { TimeframeTrainingPlanSection } from './TimeframeTrainingPlanSection';

export function DailyTrainingPlan({ user }: { user: User }) {
    const [startDate, endDate] = useMemo(() => {
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);

        return [startDate.toISOString(), endDate.toISOString()];
    }, []);

    const { request, pinnedTasks, togglePin, isCurrentUser, suggestionsByDay } =
        useWeeklyTrainingPlan(user);

    const suggestedTasks = useMemo(
        () => suggestionsByDay[new Date().getDay()],
        [suggestionsByDay],
    );

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
