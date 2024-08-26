import { formatTime } from '@/database/requirement';
import { TimelineEntry } from '@/database/timeline';
import { User } from '@/database/user';
import {
    Card,
    CardContent,
    CardHeader,
    MenuItem,
    Stack,
    TextField,
    Tooltip,
} from '@mui/material';
import { useMemo, useState } from 'react';
import ActivityCalendar, { Activity } from 'react-activity-calendar';
import { useTimeline } from '../activity/useTimeline';

const MAX_LEVEL = 4;
const MAX_COUNT = 10;
const MIN_DATE = '2024-01-01';

export const ActivityCard = ({ user }: { user: User }) => {
    const [view, setView] = useState('points');
    const { entries } = useTimeline(user.username);

    const [activities, totalCount] = useMemo(() => {
        if (view === 'points') {
            return getDojoPointsActivity(entries);
        }
        return getTimeSpentActivity(entries);
    }, [view, entries]);

    return (
        <Card>
            <CardHeader
                title={
                    <Stack
                        direction='row'
                        alignItems='center'
                        justifyContent='space-between'
                    >
                        Activity
                        <TextField
                            size='small'
                            select
                            value={view}
                            onChange={(e) => setView(e.target.value)}
                        >
                            <MenuItem value='points'>Dojo Points</MenuItem>
                            <MenuItem value='time'>Time Spent</MenuItem>
                        </TextField>
                    </Stack>
                }
            />
            <CardContent
                sx={{
                    '& .react-activity-calendar__scroll-container': { paddingTop: '1px' },
                }}
            >
                <ActivityCalendar
                    colorScheme='dark'
                    theme={{
                        dark: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
                    }}
                    data={activities}
                    renderBlock={(block, activity) => (
                        <Tooltip
                            disableInteractive
                            title={
                                view === 'points'
                                    ? `${Math.round(10 * activity.count) / 10} Dojo points on ${activity.date}`
                                    : `${formatTime(activity.count)} on ${activity.date}`
                            }
                        >
                            {block}
                        </Tooltip>
                    )}
                    labels={{
                        totalCount:
                            view === 'points'
                                ? '{{count}} Dojo points in 2024'
                                : `${formatTime(totalCount)} in 2024`,
                    }}
                    totalCount={Math.round(10 * totalCount) / 10}
                />
            </CardContent>
        </Card>
    );
};

function getActivity(
    entries: TimelineEntry[],
    field: 'dojoPoints' | 'minutesSpent',
): [Activity[], number] {
    const activities: Record<string, Activity> = {};
    let totalCount = 0;

    for (const entry of entries) {
        if (entry[field] <= 0) {
            continue;
        }

        const date = entry.date?.split('T')[0] || entry.createdAt.split('T')[0];
        if (date < MIN_DATE) {
            break;
        }

        const activity = activities[date] || {
            date,
            count: 0,
            level: 0,
        };
        activity.count += entry[field];
        activity.level = Math.ceil(
            Math.min(MAX_COUNT, activity.count) / (MAX_COUNT / MAX_LEVEL),
        );
        totalCount += entry[field];
        activities[date] = activity;
    }

    if (!activities[MIN_DATE]) {
        activities[MIN_DATE] = { date: MIN_DATE, count: 0, level: 0 };
    }

    return [
        Object.values(activities).sort((lhs, rhs) => lhs.date.localeCompare(rhs.date)),
        totalCount,
    ];
}

function getDojoPointsActivity(entries: TimelineEntry[]): [Activity[], number] {
    return getActivity(entries, 'dojoPoints');
}

function getTimeSpentActivity(entries: TimelineEntry[]): [Activity[], number] {
    return getActivity(entries, 'minutesSpent');
}
