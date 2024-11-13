import { useAuth } from '@/auth/Auth';
import { getTimeZonedDate } from '@/calendar/displayDate';
import { formatTime, RequirementCategory } from '@/database/requirement';
import { TimelineEntry } from '@/database/timeline';
import { User } from '@/database/user';
import { CategoryColors } from '@/style/ThemeProvider';
import { useLightMode } from '@/style/useLightMode';
import { WeekDays } from '@aldabil/react-scheduler/views/Month';
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Divider,
    MenuItem,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { cloneElement, useEffect, useMemo, useState } from 'react';
import {
    ActivityCalendar,
    Activity as BaseActivity,
    BlockElement,
} from 'react-activity-calendar';
import { useLocalStorage } from 'usehooks-ts';
import { useTimeline } from '../activity/useTimeline';

interface Activity extends BaseActivity {
    /** The count of the activity by category. */
    categoryCounts?: Partial<Record<RequirementCategory, number>>;
}

type TimelineEntryField = 'dojoPoints' | 'minutesSpent';

const MAX_LEVEL = 4;
const MAX_POINTS_COUNT = 10;
const MAX_HOURS_COUNT = 4 * 60;
const MIN_DATE = '2024-01-01';

const VALID_CATEGORIES = [
    RequirementCategory.Games,
    RequirementCategory.Tactics,
    RequirementCategory.Middlegames,
    RequirementCategory.Endgame,
    RequirementCategory.Opening,
    RequirementCategory.NonDojo,
];

/**
 * Renders a card showing the user's activity heatmap.
 * @param user The user whose activity will be displayed in the heatmap.
 */
export const ActivityCard = ({ user }: { user: User }) => {
    const [field, setField] = useLocalStorage<TimelineEntryField>(
        'activityHeatmap.field',
        'minutesSpent',
    );
    const { entries } = useTimeline(user.username);
    const isLight = useLightMode();
    const { user: viewer } = useAuth();
    const [, setCalendarRef] = useState<HTMLElement | null>(null);
    const [weekStartOn] = useLocalStorage<WeekDays>('calendarFilters.weekStartOn', 0);

    const { activities, totalCount, maxCount } = useMemo(() => {
        return getActivity(
            entries,
            field,
            field === 'dojoPoints' ? MAX_POINTS_COUNT : MAX_HOURS_COUNT,
            viewer,
        );
    }, [field, entries, viewer]);

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
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <TextField
                            size='small'
                            select
                            value={field}
                            onChange={(e) =>
                                setField(e.target.value as TimelineEntryField)
                            }
                        >
                            <MenuItem value='dojoPoints'>Dojo Points</MenuItem>
                            <MenuItem value='minutesSpent'>Hours Worked</MenuItem>
                        </TextField>
                    </div>
                }
            />
            <CardContent
                sx={{
                    '& .react-activity-calendar__scroll-container': {
                        paddingTop: '1px',
                        paddingBottom: '10px',
                    },
                    '& .react-activity-calendar__footer': {
                        marginLeft: '0 !important',
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
                    renderBlock={(block, activity) =>
                        renderBlock(
                            block,
                            activity as Activity,
                            field,
                            isLight ? '#EBEDF0' : '#393939',
                        )
                    }
                    labels={{
                        totalCount:
                            field === 'dojoPoints'
                                ? '{{count}} Dojo points in 2024'
                                : `${formatTime(totalCount)} in 2024`,
                    }}
                    totalCount={Math.round(10 * totalCount) / 10}
                    maxLevel={MAX_LEVEL}
                    showWeekdayLabels
                    weekStart={weekStartOn}
                    renderColorLegend={(block, level) =>
                        renderLegendTooltip(block, level, maxCount, field)
                    }
                />

                <Stack
                    direction='row'
                    flexWrap='wrap'
                    columnGap={1}
                    rowGap={0.5}
                    mt={0.5}
                >
                    {Object.entries(CategoryColors).map(([category, color]) => {
                        if (!VALID_CATEGORIES.includes(category as RequirementCategory)) {
                            return null;
                        }

                        return (
                            <Stack
                                key={category}
                                direction='row'
                                alignItems='center'
                                gap={0.5}
                            >
                                <Box
                                    sx={{
                                        height: '12px',
                                        width: '12px',
                                        borderRadius: '2px',
                                        backgroundColor: color,
                                    }}
                                />
                                <Typography variant='caption' pt='2px'>
                                    {category}
                                </Typography>
                            </Stack>
                        );
                    })}
                </Stack>
            </CardContent>
        </Card>
    );
};

/**
 * Gets a list of activities and the total count for the given parameters.
 * @param entries The timeline entries to extract data from.
 * @param field The field to extract from each timeline entry.
 * @param clamp The max value to use when calculating activity levels.
 * @param viewer The user viewing the site. Used for calculating timezones.
 * @returns A list of activities and the total count.
 */
function getActivity(
    entries: TimelineEntry[],
    field: TimelineEntryField,
    clamp: number,
    viewer?: User,
): { activities: Activity[]; totalCount: number; maxCount: number } {
    const activities: Record<string, Activity> = {};
    let totalCount = 0;
    let maxCount = 0;

    for (const entry of entries) {
        if (entry[field] <= 0 || !VALID_CATEGORIES.includes(entry.requirementCategory)) {
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
            categoryCounts: {},
        };

        activity.count += entry[field];
        if (activity.categoryCounts) {
            activity.categoryCounts[entry.requirementCategory] =
                (activity.categoryCounts[entry.requirementCategory] ?? 0) + entry[field];
        }

        if (activity.count > maxCount) {
            maxCount = activity.count;
        }

        totalCount += entry[field];
        activities[dateStr] = activity;
    }

    if (!activities[MIN_DATE]) {
        activities[MIN_DATE] = {
            date: MIN_DATE,
            count: 0,
            level: 0,
            categoryCounts: {},
        };
    }

    const endDate = new Date().toISOString().split('T')[0];
    if (!activities[endDate]) {
        activities[endDate] = {
            date: endDate,
            count: 0,
            level: 0,
            categoryCounts: {},
        };
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

    return {
        activities: Object.values(activities).sort((lhs, rhs) =>
            lhs.date.localeCompare(rhs.date),
        ),
        totalCount,
        maxCount,
    };
}

/**
 * Renders a block in the heatmap.
 * @param block The block to render, as passed from React Activity Calendar.
 * @param activity The activity associated with the block.
 * @param field The field (dojo points/minutes) being displayed.
 * @param baseColor The level 0 color.
 * @returns A block representing the given activity.
 */
function renderBlock(
    block: BlockElement,
    activity: Activity,
    field: TimelineEntryField,
    baseColor: string,
) {
    let maxCategory: RequirementCategory | undefined = undefined;
    let maxCount: number | undefined = undefined;
    let color: string | undefined = undefined;

    for (const [category, count] of Object.entries(activity.categoryCounts ?? {})) {
        if (maxCount === undefined || count > maxCount) {
            maxCategory = category as RequirementCategory;
            maxCount = count;
        }
    }

    if (maxCount && maxCategory) {
        const level = calculateLevel(
            maxCount,
            field === 'dojoPoints' ? MAX_POINTS_COUNT : MAX_HOURS_COUNT,
        );
        color = calculateColor([baseColor, CategoryColors[maxCategory]], level);
    }

    const newStyle = color ? { ...block.props.style, fill: color } : block.props.style;
    return (
        <Tooltip
            key={activity.date}
            disableInteractive
            title={renderTooltip(activity, field)}
        >
            {cloneElement(block, { style: newStyle })}
        </Tooltip>
    );
}

/**
 * Returns the level of the given count for the given max count.
 * Level will be in the range [0, MAX_LEVEL].
 * @param count The count to get the level for.
 * @param maxCount The max count. Counts >= this value will return MAX_LEVEL.
 */
function calculateLevel(count: number, maxCount: number): number {
    for (let i = 1; i <= MAX_LEVEL; i++) {
        if (count < (maxCount / MAX_LEVEL) * i) {
            return i - 1;
        }
    }
    return MAX_LEVEL;
}

/**
 * Renders a tooltip for the given activity and field.
 * @param activity The activity for the given date.
 * @param field The field (dojo points/minutes) being displayed.
 * @returns A tooltip displaying the activity's breakdown by category.
 */
function renderTooltip(activity: Activity, field: TimelineEntryField) {
    const categories = Object.entries(activity.categoryCounts ?? {}).sort(
        (lhs, rhs) => rhs[1] - lhs[1],
    );

    return (
        <Stack alignItems='center'>
            <Typography variant='caption'>
                {field === 'dojoPoints'
                    ? `${Math.round(10 * activity.count) / 10} Dojo point${activity.count !== 1 ? 's' : ''} on ${activity.date}`
                    : `${formatTime(activity.count)} on ${activity.date}`}
            </Typography>
            <Divider sx={{ width: 1 }} />
            {categories.map(([category, count]) => (
                <Stack
                    key={category}
                    direction='row'
                    justifyContent='space-between'
                    alignItems='center'
                    columnGap='1rem'
                    width={1}
                >
                    <Stack direction='row' alignItems='center' columnGap={0.5}>
                        <Box
                            sx={{
                                height: '12px',
                                width: '12px',
                                borderRadius: '2px',
                                backgroundColor:
                                    CategoryColors[category as RequirementCategory],
                            }}
                        />
                        <Typography variant='caption' pt='2px'>
                            {category}
                        </Typography>
                    </Stack>

                    <Typography variant='caption' pt='2px'>
                        {field === 'dojoPoints'
                            ? `${Math.round(10 * count) / 10} Dojo point${count !== 1 ? 's' : ''}`
                            : formatTime(count)}
                    </Typography>
                </Stack>
            ))}
        </Stack>
    );
}

/**
 * Renders a tooltip for the legend.
 * @param block The block element of the legend.
 * @param level The level of the element.
 * @param maxCount The max count for the activity heatmap.
 * @param field The field (dojo points/minutes) displayed by the heatmap.
 * @returns A tooltip wrapping the block.
 */
function renderLegendTooltip(
    block: BlockElement,
    level: number,
    maxCount: number,
    field: TimelineEntryField,
) {
    let value = '';
    const minValue = (maxCount / MAX_LEVEL) * level;
    if (field === 'minutesSpent') {
        value = formatTime(minValue);
    } else {
        value = `${minValue}`;
    }

    if (level < MAX_LEVEL) {
        const maxValue = (maxCount / MAX_LEVEL) * (level + 1);
        if (field === 'minutesSpent') {
            value += ` – ${formatTime(maxValue)}`;
        } else {
            value += ` – ${maxValue} Dojo points`;
        }
    } else {
        value += '+';
        if (field === 'dojoPoints') {
            value += ' Dojo points';
        }
    }

    return (
        <Tooltip key={level} disableInteractive title={value}>
            {block}
        </Tooltip>
    );
}

/**
 * Returns a CSS color-mix for the given color scale and level.
 * @param colors The color scale to calculate.
 * @param level The level to get the color for.
 */
function calculateColor(colors: [from: string, to: string], level: number): string {
    const [from, to] = colors;
    const mixFactor = (level / MAX_LEVEL) * 100;
    return `color-mix(in oklab, ${to} ${parseFloat(mixFactor.toFixed(2))}%, ${from})`;
}
