import { useAuth } from '@/auth/Auth';
import { getTimeZonedDate } from '@/calendar/displayDate';
import { formatTime } from '@/database/requirement';
import { TimelineEntry } from '@/database/timeline';
import { User } from '@/database/user';
import { useLightMode } from '@/style/useLightMode';
import {
    Card,
    CardContent,
    CardHeader,
    MenuItem,
    TextField,
    Tooltip,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import ActivityCalendar, { Activity } from 'react-activity-calendar';
import { useTimeline } from '../activity/useTimeline';

const MAX_LEVEL = 4;
const MAX_POINTS_COUNT = 10;
const MAX_HOURS_COUNT = 5 * 60;
const MIN_DATE = '2024-01-01';

export const ActivityCard = ({ user }: { user: User }) => {
    const [view, setView] = useState('time');
    const { entries } = useTimeline(user.username);
    const isLight = useLightMode();
    const { user: viewer } = useAuth();
    const [, setCalendarRef] = useState<HTMLElement | null>(null);

    const [activities, totalCount] = useMemo(() => {
        if (view === 'points') {
            return getDojoPointsActivity(entries, viewer);
        }
        return getTimeSpentActivity(entries, viewer);
    }, [view, entries, viewer]);

    useEffect(() => {
        const scroller = document.getElementsByClassName(
            'react-activity-calendar__scroll-container',
        )[0];
        if (scroller) {
            scroller.scrollLeft = scroller.scrollWidth;
        }
    });

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
                    '& .react-activity-calendar__scroll-container': {
                        paddingTop: '1px',
                        paddingBottom: '10px',
                    },
                }}
            >
                <ActivityCalendar
                    ref={setCalendarRef}
                    colorScheme={isLight ? 'light' : 'dark'}
                    theme={{
                        dark: ['#393939', '#F7941F'],
                        light: ['#EBEDF0', '#F7941F'],
                    }}
                    data={activities}
                    renderBlock={(block, activity) => (
                        <Tooltip
                            disableInteractive
                            title={
                                view === 'points'
                                    ? `${Math.round(10 * activity.count) / 10} Dojo point${activity.count !== 1 ? 's' : ''} on ${activity.date}`
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
                    showWeekdayLabels
                />
            </CardContent>
        </Card>
    );
};

function getActivity(
    entries: TimelineEntry[],
    field: 'dojoPoints' | 'minutesSpent',
    clamp: number,
    viewer?: User,
): [Activity[], number] {
    const activities: Record<string, Activity> = {};
    let totalCount = 0;
    let maxCount = 0;

    for (const entry of entries) {
        if (entry[field] <= 0) {
            continue;
        }

        if ((entry.date || entry.createdAt) < MIN_DATE) {
            break;
        }

        let date = new Date(entry.date || entry.createdAt);
        date = getTimeZonedDate(date, viewer?.timezoneOverride);

        const dateStr = `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;

        const activity = activities[dateStr] || {
            date: dateStr,
            count: 0,
            level: 0,
        };
        activity.count += entry[field];

        if (activity.count > maxCount) {
            maxCount = activity.count;
        }

        totalCount += entry[field];
        activities[dateStr] = activity;
    }

    if (!activities[MIN_DATE]) {
        activities[MIN_DATE] = { date: MIN_DATE, count: 0, level: 0 };
    }

    const endDate = new Date().toISOString().split('T')[0];
    if (!activities[endDate]) {
        activities[endDate] = { date: endDate, count: 0, level: 0 };
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

function getDojoPointsActivity(
    entries: TimelineEntry[],
    viewer?: User,
): [Activity[], number] {
    return getActivity(entries, 'dojoPoints', MAX_POINTS_COUNT, viewer);
}

function getTimeSpentActivity(
    entries: TimelineEntry[],
    viewer?: User,
): [Activity[], number] {
    return getActivity(entries, 'minutesSpent', MAX_HOURS_COUNT, viewer);
}
