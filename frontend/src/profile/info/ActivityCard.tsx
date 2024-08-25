import { User } from '@/database/user';
import { Card, CardContent, CardHeader, Tooltip } from '@mui/material';
import { useMemo } from 'react';
import ActivityCalendar, { Activity } from 'react-activity-calendar';
import { useTimeline } from '../activity/useTimeline';

const MAX_LEVEL = 4;
const MAX_COUNT = 10;

export const ActivityCard = ({ user }: { user: User }) => {
    const { entries } = useTimeline(user.username);

    const [activities, totalCount] = useMemo(() => {
        const activities: Record<string, Activity> = {};
        let totalCount = 0;

        for (const entry of entries) {
            if (entry.dojoPoints <= 0) {
                continue;
            }

            const date = entry.date?.split('T')[0] || entry.createdAt.split('T')[0];
            const activity = activities[date] || {
                date,
                count: 0,
                level: Math.floor(Math.random() * 4),
            };
            activity.count += entry.dojoPoints;
            activity.level = Math.ceil(
                Math.min(MAX_COUNT, activity.count) / (MAX_COUNT / MAX_LEVEL),
            );
            totalCount += entry.dojoPoints;
            activities[date] = activity;
        }

        return [
            Object.values(activities).sort((lhs, rhs) =>
                lhs.date.localeCompare(rhs.date),
            ),
            totalCount,
        ];
    }, [entries]);

    console.log('Activities: ', activities);

    return (
        <Card>
            <CardHeader title='Activity' />
            <CardContent>
                <ActivityCalendar
                    theme={{
                        dark: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
                        light: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
                    }}
                    data={activities}
                    renderBlock={(block, activity) => (
                        <Tooltip
                            disableInteractive
                            title={`${Math.round(10 * activity.count) / 10} Dojo points on ${activity.date}`}
                        >
                            {block}
                        </Tooltip>
                    )}
                    labels={{
                        totalCount: '{{count}} Dojo points in the past year',
                    }}
                    totalCount={Math.round(10 * totalCount) / 10}
                />
            </CardContent>
        </Card>
    );
};
