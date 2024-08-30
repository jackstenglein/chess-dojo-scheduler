import { formatTime } from '@/database/requirement';
import { TimelineEntry } from '@/database/timeline';
import { User } from '@/database/user';
import {
    Card,
    CardContent,
    CardHeader,
    MenuItem,
    TextField,
    Tooltip,
} from '@mui/material';
import { useMemo, useState } from 'react';
import ActivityCalendar, { Activity } from 'react-activity-calendar';
import { useTimeline } from '../activity/useTimeline';

const MAX_LEVEL = 4;
const MAX_POINTS_COUNT = 10;
const MAX_HOURS_COUNT = 5 * 60;
const MIN_DATE = '2024-01-01';

export const ActivityCard = ({ user }: { user: User }) => {
    const [view, setView] = useState('time');
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
                    <TextField
                        size='small'
                        select
                        value={view}
                        onChange={(e) => setView(e.target.value)}
                    >
                        <MenuItem value='points'>Dojo Points</MenuItem>
                        <MenuItem value='time'>Hours Worked</MenuItem>
                    </TextField>
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
                        dark: ['#ebedf0', '#F7941F'],
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
                    maxLevel={MAX_LEVEL}
                />
            </CardContent>
        </Card>
    );
};

function getActivity(
    entries: TimelineEntry[],
    field: 'dojoPoints' | 'minutesSpent',
    clamp?: number,
): [Activity[], number] {
    const activities: Record<string, Activity> = {};
    let totalCount = 0;
    let maxCount = 0;

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

        if (activity.count > maxCount) {
            maxCount = activity.count;
        }

        totalCount += entry[field];
        activities[date] = activity;
    }

    if (!activities[MIN_DATE]) {
        activities[MIN_DATE] = { date: MIN_DATE, count: 0, level: 0 };
    }

    if (clamp) {
        maxCount = Math.min(maxCount, clamp);
    }

    if (maxCount) {
        for (const activity of Object.values(activities)) {
            activity.level = Math.ceil(
                Math.min(maxCount, activity.count) / (maxCount / MAX_LEVEL),
            );
        }
    }

    return [
        Object.values(activities).sort((lhs, rhs) => lhs.date.localeCompare(rhs.date)),
        totalCount,
    ];
}

function getDojoPointsActivity(entries: TimelineEntry[]): [Activity[], number] {
    return getActivity(entries, 'dojoPoints', MAX_POINTS_COUNT);
}

function getTimeSpentActivity(entries: TimelineEntry[]): [Activity[], number] {
    return getActivity(entries, 'minutesSpent', MAX_HOURS_COUNT);
}
