import { useAuth } from '@/auth/Auth';
import { getTimeZonedDate } from '@/components/calendar/displayDate';
import { formatTime, RequirementCategory } from '@/database/requirement';
import { TimelineEntry, TimelineSpecialRequirementId } from '@/database/timeline';
import { User, WorkGoalHistory, WorkGoalSettings } from '@/database/user';
import CohortIcon, { cohortIcons } from '@/scoreboard/CohortIcon';
import { CategoryColors } from '@/style/ThemeProvider';
import { useLightMode } from '@/style/useLightMode';
import { displayRequirementCategory } from '@jackstenglein/chess-dojo-common/src/database/requirement';
import { CheckCircle, Close, HourglassBottom } from '@mui/icons-material';
import {
    Box,
    Checkbox,
    Divider,
    FormControlLabel,
    Paper,
    PaperProps,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { cloneElement, useEffect, useMemo, useState } from 'react';
import {
    ActivityCalendar,
    Activity as BaseActivity,
    BlockElement,
    DayIndex,
} from 'react-activity-calendar';
import { GiCrossedSwords } from 'react-icons/gi';
import { DEFAULT_WORK_GOAL } from '../trainingPlan/workGoal';
import { MIN_BLOCK_SIZE } from './HeatmapCard';
import { HeatmapOptions, TimelineEntryField, useHeatmapOptions } from './HeatmapOptions';

interface CategoryCount {
    /** The count of the category spent on custom tasks. */
    custom: number;

    /** The count of the category spent on training plan tasks. */
    trainingPlan: number;
}

interface ExtendedBaseActivity extends BaseActivity {
    /** The total number of Dojo points earned on the given day. */
    dojoPoints?: number;

    /** The total number of minutes spent on the given day. */
    minutesSpent?: number;

    /** The count of the activity by category and field. */
    categoryCounts?: Partial<
        Record<RequirementCategory, { dojoPoints: CategoryCount; minutesSpent: CategoryCount }>
    >;

    /** Whether a classical game was played on this date. */
    gamePlayed?: boolean;

    /** The highest cohort the user graduated from on this date. */
    graduation?: string;
}

interface Activity extends ExtendedBaseActivity {
    /** The total number of Dojo points earned on the given day. */
    dojoPoints: number;

    /** The total number of minutes spent on the given day. */
    minutesSpent: number;

    /** The count of the activity by category and field. */
    categoryCounts: Partial<
        Record<RequirementCategory, { dojoPoints: CategoryCount; minutesSpent: CategoryCount }>
    >;
}

interface WeekSummary {
    /** The date that the week summary ends on. */
    date: string;

    /** The total number of Dojo points earned in the given week. */
    dojoPoints: number;

    /** The total number of minutes spent in the given week. */
    minutesSpent: number;

    /** The count of the activity by category. */
    categoryCounts: Partial<
        Record<RequirementCategory, { dojoPoints: CategoryCount; minutesSpent: CategoryCount }>
    >;

    /** Whether a classical game was played on this date. */
    gamePlayed?: boolean;

    /** The highest cohort the user graduated from on this date. */
    graduation?: string;
}

const MAX_LEVEL = 4;

/**
 * Classical game requirement ID used to render the classical game sword icon.
 */
const CLASSICAL_GAMES_REQUIREMENT_ID = '38f46441-7a4e-4506-8632-166bcbe78baf';

/**
 * Valid categories for the heatmap to render.
 */
const VALID_CATEGORIES = [
    RequirementCategory.Games,
    RequirementCategory.Tactics,
    RequirementCategory.Middlegames,
    RequirementCategory.Endgame,
    RequirementCategory.Opening,
    RequirementCategory.NonDojo,
    RequirementCategory.Graduation,
];

/**
 * Valid categories for the heatmap tooltip to render.
 */
const VALID_TOOLTIP_CATEGORIES = [
    RequirementCategory.Games,
    RequirementCategory.Tactics,
    RequirementCategory.Middlegames,
    RequirementCategory.Endgame,
    RequirementCategory.Opening,
    RequirementCategory.NonDojo,
];

/** The color of the heatmap in monochrome color mode. */
const MONOCHROME_COLOR = '#6f02e3';

/** The array of legend colors in light theme. */
const LIGHT_THEME = Array(MAX_LEVEL + 1)
    .fill(0)
    .map((_, level) => mixColors('#EBEDF0', MONOCHROME_COLOR, level / MAX_LEVEL));

/** The array of legend colors in dark theme. */
const DARK_THEME = Array(MAX_LEVEL + 1)
    .fill(0)
    .map((_, level) => mixColors('#393939', MONOCHROME_COLOR, level / MAX_LEVEL));

/** The margin above the first weekday label. */
const WEEKDAY_LEGEND_TOP_MARGIN = 29;

/** The space between adjacent blocks in the heatmap. */
const BLOCK_SPACING = 4;

/** Labels of the weekdays by their index. */
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];

/**
 * Renders the Heatmap, including the options and legend, for the given timeline entries.
 */
export function Heatmap({
    entries,
    description,
    blockSize = MIN_BLOCK_SIZE,
    onPopOut,
    minDate,
    maxDate,
    workGoalHistory,
    defaultWorkGoal,
    slotProps,
}: {
    entries: TimelineEntry[];
    description: string;
    blockSize?: number;
    onPopOut?: () => void;
    minDate?: string;
    maxDate?: string;
    workGoalHistory: WorkGoalHistory[];
    defaultWorkGoal?: WorkGoalSettings;
    slotProps?: {
        weekdayLabelPaper?: PaperProps;
    };
}) {
    const isLight = useLightMode();
    const { user: viewer } = useAuth();
    const [, setCalendarRef] = useState<HTMLElement | null>(null);
    const { field, colorMode, maxPoints, maxMinutes, weekStartOn, weekEndOn } = useHeatmapOptions();
    const clamp = field === 'dojoPoints' ? maxPoints : maxMinutes;
    const theme = isLight ? LIGHT_THEME : DARK_THEME;

    if (!maxDate) {
        maxDate = new Date().toISOString().split('T')[0];
    }
    if (!minDate) {
        minDate = `${parseInt(maxDate.split('-')[0]) - 1}${maxDate.slice(4)}`;
        const d = new Date(minDate);
        if (d.getUTCDay() !== weekStartOn) {
            d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() - weekStartOn + 7) % 7));
            minDate = d.toISOString().split('T')[0];
        }
    }

    const { activities, weekSummaries, totalDojoPoints, totalMinutesSpent } = useMemo(() => {
        return getActivity(entries, minDate, maxDate, viewer);
    }, [entries, minDate, maxDate, viewer]);

    useEffect(() => {
        const scroller = document.getElementById('heatmap-scroll-container');
        if (scroller) {
            scroller.scrollLeft = scroller.scrollWidth;
        }
    });

    return (
        <Stack
            maxWidth={1}
            sx={{
                '& .react-activity-calendar__scroll-container': {
                    paddingTop: '1px',
                    paddingBottom: '10px',
                    overflow: 'visible !important',
                },
                '& .react-activity-calendar__footer': {
                    marginLeft: '0 !important',
                },
            }}
        >
            <HeatmapOptions onPopOut={onPopOut} />

            <Stack id='heatmap-scroll-container' direction='row' sx={{ overflowX: 'auto' }}>
                <Paper
                    elevation={1}
                    sx={{ position: 'sticky', left: 0, pr: 0.75, borderRadius: 0, pb: 4 }}
                    {...slotProps?.weekdayLabelPaper}
                >
                    <Stack>
                        {Array(3)
                            .fill(0)
                            .map((_, i) => (
                                <Stack
                                    key={i}
                                    sx={{
                                        mt: `${blockSize + (i === 0 ? WEEKDAY_LEGEND_TOP_MARGIN : 2 * BLOCK_SPACING)}px`,
                                        height: `${blockSize}px`,
                                    }}
                                    alignItems='center'
                                    justifyContent='center'
                                >
                                    <Typography variant='caption'>
                                        {WEEKDAY_LABELS[(i * 2 + 1 + weekStartOn) % 7]}
                                    </Typography>
                                </Stack>
                            ))}
                        <Stack
                            sx={{
                                mt: `${blockSize + 2 * BLOCK_SPACING + 7}px`,
                                height: `${blockSize}px`,
                            }}
                            alignItems='center'
                            justifyContent='center'
                        >
                            <Typography variant='caption'>Week</Typography>
                        </Stack>
                    </Stack>
                </Paper>

                <Stack>
                    <ActivityCalendar
                        ref={setCalendarRef}
                        colorScheme={isLight ? 'light' : 'dark'}
                        theme={{
                            light: LIGHT_THEME,
                            dark: DARK_THEME,
                        }}
                        data={activities}
                        renderBlock={(block, activity) => (
                            <Block
                                key={activity.date}
                                block={block}
                                activity={activity as Activity}
                                field={field}
                                baseColor={theme[0]}
                                clamp={clamp}
                                weekEndOn={weekEndOn}
                                weekSummaries={weekSummaries}
                                workGoalHistory={workGoalHistory}
                                defaultWorkGoal={defaultWorkGoal}
                                monochrome={colorMode === 'monochrome'}
                                maxDate={maxDate}
                            />
                        )}
                        maxLevel={MAX_LEVEL}
                        weekStart={weekStartOn as DayIndex}
                        hideColorLegend
                        hideTotalCount
                        blockSize={blockSize}
                    />
                    <Divider sx={{ mt: '-6px' }} />
                    <Divider sx={{ mt: '2px' }} />
                </Stack>
            </Stack>
            <Stack
                direction='row'
                justifyContent='space-between'
                alignItems='center'
                flexWrap='wrap'
                gap='4px 16px'
                mt={0.5}
            >
                <Typography sx={{ fontSize: '14px' }}>
                    {field === 'dojoPoints'
                        ? `${Math.round(10 * totalDojoPoints) / 10} Dojo points ${description}`
                        : `${formatTime(totalMinutesSpent)} ${description}`}
                </Typography>

                <Stack direction='row' alignItems='center' gap='3px'>
                    <Typography sx={{ fontSize: '14px', mr: '0.4em' }}>Less</Typography>

                    {Array(MAX_LEVEL + 1)
                        .fill(0)
                        .map((_, i) => (
                            <LegendTooltip
                                key={i}
                                block={
                                    <svg width={blockSize} height={blockSize}>
                                        <rect
                                            width={blockSize}
                                            height={blockSize}
                                            fill={theme[i]}
                                            rx='2'
                                            ry='2'
                                            style={{
                                                stroke: 'rgba(255, 255, 255, 0.04)',
                                            }}
                                        ></rect>
                                    </svg>
                                }
                                level={i}
                                clamp={clamp}
                                field={field}
                            />
                        ))}

                    <Typography sx={{ fontSize: '14px', ml: '0.4em' }}>More</Typography>
                </Stack>
            </Stack>
            <CategoryLegend />
        </Stack>
    );
}

/**
 * Renders the legend for the heatmap categories.
 */
export function CategoryLegend() {
    const { colorMode, setColorMode } = useHeatmapOptions();

    return (
        <Stack mt={0.5} alignItems='start'>
            <FormControlLabel
                control={
                    <Checkbox
                        checked={colorMode === 'monochrome'}
                        onChange={(e) => setColorMode(e.target.checked ? 'monochrome' : 'standard')}
                        sx={{ '& .MuiSvgIcon-root': { fontSize: '1rem' } }}
                    />
                }
                label='Single Color Mode'
                slotProps={{ typography: { variant: 'caption' } }}
            />

            {colorMode !== 'monochrome' && (
                <Stack direction='row' flexWrap='wrap' columnGap={1} rowGap={0.5} mt={0.5}>
                    {VALID_TOOLTIP_CATEGORIES.map((category) => {
                        const color = CategoryColors[category];
                        return (
                            <Stack key={category} direction='row' alignItems='center' gap={0.5}>
                                <Box
                                    sx={{
                                        height: '12px',
                                        width: '12px',
                                        borderRadius: '2px',
                                        backgroundColor: color,
                                    }}
                                />
                                {category === RequirementCategory.NonDojo && (
                                    <svg
                                        style={{
                                            width: '12px',
                                            height: '12px',
                                            position: 'absolute',
                                        }}
                                    >
                                        <StripePattern />
                                        <rect
                                            x={0}
                                            y={0}
                                            width={12}
                                            height={12}
                                            fill='url(#diagonalHatch)'
                                        />
                                    </svg>
                                )}
                                <Typography variant='caption' pt='2px'>
                                    {category === RequirementCategory.NonDojo
                                        ? 'Custom Task'
                                        : displayRequirementCategory(category)}
                                </Typography>
                            </Stack>
                        );
                    })}

                    <Stack direction='row' alignItems='center' columnGap={0.5}>
                        <GiCrossedSwords />
                        <Typography variant='caption' pt='2px'>
                            Classical Game Played
                        </Typography>
                    </Stack>
                </Stack>
            )}
        </Stack>
    );
}

/**
 * Gets a list of activities and the total count for the given parameters.
 * @param entries The timeline entries to extract data from.
 * @param minDate The minimum allowed date for the heatmap.
 * @param maxDate The maximum allowed date for the heatmap.
 * @param viewer The user viewing the site. Used for calculating timezones.
 * @returns A list of activities and the total count.
 */
function getActivity(
    entries: TimelineEntry[],
    minDate: string,
    maxDate: string,
    viewer?: User,
): {
    activities: Activity[];
    weekSummaries: Record<string, WeekSummary>;
    totalDojoPoints: number;
    totalMinutesSpent: number;
} {
    const activities: Record<string, Activity> = {};
    let totalDojoPoints = 0;
    let totalMinutesSpent = 0;

    for (const entry of entries) {
        if (!VALID_CATEGORIES.includes(entry.requirementCategory)) {
            continue;
        }
        if (entry.dojoPoints < 0 || entry.minutesSpent < 0) {
            continue;
        }
        if ((entry.date || entry.createdAt).slice(0, 10) > maxDate) {
            continue;
        }
        if ((entry.date || entry.createdAt) < minDate) {
            break;
        }

        let date = new Date(entry.date || entry.createdAt);
        date = getTimeZonedDate(date, viewer?.timezoneOverride);

        const dateStr = `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;

        const activity = activities[dateStr] || {
            date: dateStr,
            count: 0,
            level: 0,
            dojoPoints: 0,
            minutesSpent: 0,
            categoryCounts: {},
        };

        if (entry.requirementId === CLASSICAL_GAMES_REQUIREMENT_ID) {
            activity.gamePlayed = true;
        }
        if (
            entry.requirementId === TimelineSpecialRequirementId.Graduation &&
            (!activity.graduation || parseInt(activity.graduation) < parseInt(entry.cohort))
        ) {
            activity.graduation = entry.cohort;
        }

        activity.dojoPoints += entry.dojoPoints;
        activity.minutesSpent += entry.minutesSpent;

        const category = activity.categoryCounts[entry.requirementCategory] || {
            dojoPoints: { custom: 0, trainingPlan: 0 },
            minutesSpent: { custom: 0, trainingPlan: 0 },
        };
        if (entry.isCustomRequirement) {
            category.dojoPoints.custom += entry.dojoPoints;
            category.minutesSpent.custom += entry.minutesSpent;
        } else {
            category.dojoPoints.trainingPlan += entry.dojoPoints;
            category.minutesSpent.trainingPlan += entry.minutesSpent;
        }
        activity.categoryCounts[entry.requirementCategory] = category;

        totalDojoPoints += entry.dojoPoints;
        totalMinutesSpent += entry.minutesSpent;
        activities[dateStr] = activity;
    }

    if (!activities[minDate]) {
        activities[minDate] = {
            date: minDate,
            count: 0,
            level: 0,
            dojoPoints: 0,
            minutesSpent: 0,
            categoryCounts: {},
        };
    }

    if (!activities[maxDate]) {
        activities[maxDate] = {
            date: maxDate,
            count: 0,
            level: 0,
            dojoPoints: 0,
            minutesSpent: 0,
            categoryCounts: {},
        };
    }

    const finalActivities = Object.values(activities).sort((lhs, rhs) =>
        lhs.date.localeCompare(rhs.date),
    );

    const date = new Date(minDate);
    date.setUTCDate(date.getUTCDate() + 6);
    const weekSummaries: Record<string, WeekSummary> = {
        [date.toISOString().split('T')[0]]: defaultWeekSummary(date.toISOString().split('T')[0]),
    };

    for (const activity of finalActivities) {
        if (activity.date > date.toISOString()) {
            while (activity.date > date.toISOString()) {
                date.setUTCDate(date.getUTCDate() + 7);
            }
            weekSummaries[date.toISOString().split('T')[0]] = defaultWeekSummary(
                date.toISOString().split('T')[0],
            );
        }

        mergeActivity(weekSummaries[date.toISOString().split('T')[0]], activity);
    }

    return {
        activities: finalActivities,
        totalDojoPoints,
        totalMinutesSpent,
        weekSummaries,
    };
}

/**
 * Returns a default week summary.
 * @param date The date the week summary ends on.
 */
function defaultWeekSummary(date: string): WeekSummary {
    return { date, dojoPoints: 0, minutesSpent: 0, categoryCounts: {} };
}

/**
 * Merges the given activity into the given week summary.
 * @param target The week summary to merge into.
 * @param source The activity to merge from.
 */
function mergeActivity(target: WeekSummary, source: Activity) {
    if (source.gamePlayed) {
        target.gamePlayed = true;
    }
    if (
        source.graduation &&
        (!target.graduation || parseInt(target.graduation) < parseInt(source.graduation))
    ) {
        target.graduation = source.graduation;
    }

    target.dojoPoints += source.dojoPoints;
    target.minutesSpent += source.minutesSpent;

    for (const [category, count] of Object.entries(source.categoryCounts || {})) {
        const categoryCount = target.categoryCounts[category as RequirementCategory] || {
            dojoPoints: { custom: 0, trainingPlan: 0 },
            minutesSpent: { custom: 0, trainingPlan: 0 },
        };
        categoryCount.dojoPoints.custom += count.dojoPoints.custom;
        categoryCount.dojoPoints.trainingPlan += count.dojoPoints.trainingPlan;
        categoryCount.minutesSpent.custom += count.minutesSpent.custom;
        categoryCount.minutesSpent.trainingPlan += count.minutesSpent.trainingPlan;
        target.categoryCounts[category as RequirementCategory] = categoryCount;
    }
}

/**
 * Renders a block in the heatmap.
 * @param block The block to render, as passed from React Activity Calendar.
 * @param activity The activity associated with the block.
 * @param field The field (dojo points/minutes) being displayed.
 * @param baseColor The level 0 color.
 * @param clamp The maximum count used for determining color level.
 * @param weekEndOn The index of the day the viewer's week ends on.
 * @param weekSummaries A map from date to the week summary for the week ending on that date.
 * @param workGoalHistory A list of the user's work goal history.
 * @param defaultWorkGoal The default work goal to use if not found in the history.
 * @param monochrome Whether to render the block in single-color mode or not.
 * @returns A block representing the given activity.
 */
function Block({
    block,
    activity,
    field,
    baseColor,
    clamp,
    weekEndOn,
    weekSummaries,
    workGoalHistory,
    defaultWorkGoal,
    monochrome,
    maxDate,
}: {
    block: BlockElement;
    activity: Activity | ExtendedBaseActivity;
    field: TimelineEntryField;
    baseColor: string;
    clamp: number;
    weekEndOn: number;
    weekSummaries: Record<string, WeekSummary>;
    workGoalHistory: WorkGoalHistory[];
    defaultWorkGoal?: WorkGoalSettings;
    monochrome?: boolean;
    maxDate: string;
}) {
    let maxCategory: RequirementCategory | undefined = undefined;
    let totalCount = 0;
    let maxCount: number | undefined = undefined;
    let color: string | undefined = undefined;
    let isCustom = false;

    if (monochrome) {
        const level = calculateLevel(activity[field], clamp);
        color = calculateColor([baseColor, MONOCHROME_COLOR], level);
    } else {
        for (const category of Object.values(RequirementCategory)) {
            const count = activity.categoryCounts?.[category as RequirementCategory];
            if (!count) {
                continue;
            }

            const currentCount = count[field].custom + count[field].trainingPlan;
            totalCount += currentCount;
            if (maxCount === undefined || currentCount > maxCount) {
                maxCategory = category as RequirementCategory;
                maxCount = currentCount;
            }
        }

        if (maxCount && maxCategory) {
            const level = calculateLevel(totalCount, clamp);
            color = calculateColor([baseColor, CategoryColors[maxCategory]], level);
            isCustom =
                (activity.categoryCounts?.[maxCategory]?.[field].custom ?? 0) >
                (activity.categoryCounts?.[maxCategory]?.[field].trainingPlan ?? 0);
        }
    }

    const newStyle = color ? { ...block.props.style, fill: color } : block.props.style;
    const icon = Boolean(activity.graduation || activity.gamePlayed);

    const isEndOfWeek = new Date(activity.date).getUTCDay() === weekEndOn;
    const isEnd = activity.date === maxDate;
    let weekSummaryY = (block.props.y as number) + (block.props.height as number) + 12;
    let weekSummary = weekSummaries[activity.date] ?? defaultWeekSummary(activity.date);

    if (isEnd && !isEndOfWeek) {
        weekSummary =
            weekSummaries[Object.keys(weekSummaries).sort((lhs, rhs) => (rhs > lhs ? 1 : -1))[0]];
        for (let i = new Date(activity.date).getUTCDay(); i !== weekEndOn; i = (i + 1) % 7) {
            weekSummaryY += (block.props.height as number) + BLOCK_SPACING;
        }
    }

    return (
        <>
            {activity.graduation ? (
                <image
                    href={cohortIcons[activity.graduation]}
                    x={block.props.x}
                    y={block.props.y}
                    width={block.props.width}
                    height={block.props.height}
                    crossOrigin='anonymous'
                />
            ) : (
                activity.gamePlayed && (
                    <GiCrossedSwords
                        x={block.props.x}
                        y={block.props.y}
                        width={block.props.width}
                        height={block.props.height}
                        fontSize={`${block.props.width}px`}
                    />
                )
            )}

            {isCustom && !activity.graduation && !activity.gamePlayed && (
                <>
                    {cloneElement(block, {
                        style: {
                            ...newStyle,
                            ...(icon ? { fill: 'transparent', stroke: 'transparent' } : {}),
                        },
                    })}
                    <StripePattern />
                </>
            )}

            <Tooltip
                key={activity.date}
                disableInteractive
                title={<BlockTooltip activity={activity} field={field} />}
            >
                {isCustom && !activity.graduation && !activity.gamePlayed ? (
                    <rect
                        x={block.props.x}
                        y={block.props.y}
                        width={block.props.width}
                        height={block.props.height}
                        fill='url(#diagonalHatch)'
                    />
                ) : (
                    cloneElement(block, {
                        style: {
                            ...newStyle,
                            ...(icon ? { fill: 'transparent', stroke: 'transparent' } : {}),
                        },
                    })
                )}
            </Tooltip>

            {(isEndOfWeek || isEnd) && (
                <WeekSummaryBlock
                    workGoalHistory={workGoalHistory}
                    defaultWorkGoal={defaultWorkGoal}
                    weekSummary={weekSummary}
                    x={block.props.x as number}
                    y={weekSummaryY}
                    size={block.props.width as number}
                    field={field}
                    inProgress={!isEndOfWeek}
                />
            )}
        </>
    );
}

/**
 * Renders a block indicating whether the user met their weekly goal or not.
 * @param workGoalHistory The user's work goal history.
 * @param defaultWorkGoal The default work goal to use if not found in the history.
 * @param weekSummary The week summary to render the block for.
 * @param field The timeline field being displayed.
 * @param x The x position of the block.
 * @param y The y position of the block.
 * @param size The size of the block.
 * @param inProgress Whether the week is still in progress.
 * @returns
 */
function WeekSummaryBlock({
    workGoalHistory,
    defaultWorkGoal,
    weekSummary,
    field,
    x,
    y,
    size,
    inProgress,
}: {
    workGoalHistory: WorkGoalHistory[];
    defaultWorkGoal?: WorkGoalSettings;
    weekSummary: WeekSummary;
    field: TimelineEntryField;
    x: number;
    y: number;
    size: number;
    inProgress: boolean;
}) {
    const workGoal =
        workGoalHistory.findLast((history) => history.date.split('T')[0] <= weekSummary.date)
            ?.workGoal ??
        defaultWorkGoal ??
        DEFAULT_WORK_GOAL;
    const goalMinutes = workGoal.minutesPerDay.reduce((sum, value) => sum + value, 0);

    let Icon = inProgress ? HourglassBottom : Close;
    let color: 'error.main' | 'success.main' | 'text.secondary' = inProgress
        ? 'text.secondary'
        : 'error.main';
    if (weekSummary.minutesSpent >= goalMinutes) {
        Icon = CheckCircle;
        color = 'success.main';
    }

    return (
        <>
            <Icon x={x} y={y} width={size} height={size} sx={{ fontSize: `${size}px`, color }} />
            <Tooltip
                title={
                    <WeekSummaryTooltip
                        weekSummary={weekSummary}
                        field={field}
                        goal={workGoal}
                        inProgress={inProgress}
                    />
                }
            >
                <rect x={x} y={y} width={size} height={size} fill='transparent' />
            </Tooltip>
        </>
    );
}

/**
 * Returns the level of the given count for the given max count.
 * Level will be in the range [0, MAX_LEVEL].
 * @param count The count to get the level for.
 * @param maxCount The max count. Counts >= this value will return MAX_LEVEL.
 */
function calculateLevel(count: number | undefined, maxCount: number): number {
    if (!count) {
        return 0;
    }
    for (let i = 1; i < MAX_LEVEL; i++) {
        if (count < (maxCount / (MAX_LEVEL - 1)) * i) {
            return i;
        }
    }
    return MAX_LEVEL;
}

/**
 * Renders a tooltip for a heatmap block with the given activity and field.
 * @param activity The activity for the given block.
 * @param field The field (dojo points/minutes) being displayed.
 * @returns A tooltip displaying the activity's breakdown by category.
 */
function BlockTooltip({
    activity,
    field,
}: {
    activity: Activity | ExtendedBaseActivity;
    field: TimelineEntryField;
}) {
    const categories = Object.entries(activity.categoryCounts ?? {})
        .filter((entry) => VALID_TOOLTIP_CATEGORIES.includes(entry[0] as RequirementCategory))
        .sort(
            (lhs, rhs) =>
                rhs[1][field].custom +
                rhs[1][field].trainingPlan -
                (lhs[1][field].custom + lhs[1][field].trainingPlan),
        );

    return (
        <Stack alignItems='center'>
            <Typography variant='caption'>
                {field === 'dojoPoints'
                    ? `${Math.round(10 * (activity.dojoPoints || 0)) / 10} Dojo point${activity.dojoPoints !== 1 ? 's' : ''} on ${activity.date}`
                    : `${formatTime(activity.minutesSpent || 0)} on ${activity.date}`}
            </Typography>
            <Divider sx={{ width: 1 }} />
            {activity.graduation && (
                <Stack
                    direction='row'
                    justifyContent='space-between'
                    alignItems='center'
                    columnGap='1rem'
                    width={1}
                >
                    <Stack direction='row' alignItems='center' columnGap={0.5}>
                        <CohortIcon tooltip='' cohort={activity.graduation} size={12} />
                        <Typography variant='caption' pt='2px'>
                            Graduated from {activity.graduation}
                        </Typography>
                    </Stack>
                </Stack>
            )}

            {activity.gamePlayed && (
                <Stack
                    direction='row'
                    justifyContent='space-between'
                    alignItems='center'
                    columnGap='1rem'
                    width={1}
                >
                    <Stack direction='row' alignItems='center' columnGap={0.5}>
                        <GiCrossedSwords />
                        <Typography variant='caption' pt='2px'>
                            Classical Game Played
                        </Typography>
                    </Stack>
                </Stack>
            )}
            {categories.map(([category, count]) => {
                const rows = [
                    { category, count: count[field].trainingPlan },
                    {
                        category: `${category} (Custom)`,
                        count: count[field].custom,
                        striped: true,
                    },
                ]
                    .filter((x) => x.count)
                    .sort((x, y) => y.count - x.count);

                return rows.map((row) => (
                    <TooltipRow
                        key={row.category}
                        category={row.category}
                        field={field}
                        count={row.count}
                        backgroundColor={CategoryColors[category as RequirementCategory]}
                        striped={row.striped}
                    />
                ));
            })}
        </Stack>
    );
}

/**
 * Renders a tooltip for the week summary icon.
 * @param weekSummary The week summary to render the tooltip for.
 * @param field The field (dojo points/minutes) being displayed.
 * @param goal The work goal for the week.
 * @param inProgress Whether the week is still in progress.
 * @returns A tooltip displaying the week summary in detail.
 */
function WeekSummaryTooltip({
    weekSummary,
    field,
    goal,
    inProgress,
}: {
    weekSummary: WeekSummary;
    field: TimelineEntryField;
    goal: WorkGoalSettings;
    inProgress: boolean;
}) {
    const startDate = new Date(weekSummary.date);
    startDate.setDate(startDate.getDate() - 6);
    const startDateStr = `${startDate.getUTCFullYear()}-${`${startDate.getUTCMonth() + 1}`.padStart(2, '0')}-${`${startDate.getUTCDate()}`.padStart(2, '0')}`;

    const categories = Object.entries(weekSummary.categoryCounts ?? {})
        .filter((entry) => VALID_TOOLTIP_CATEGORIES.includes(entry[0] as RequirementCategory))
        .sort(
            (lhs, rhs) =>
                rhs[1][field].custom +
                rhs[1][field].trainingPlan -
                (lhs[1][field].custom + lhs[1][field].trainingPlan),
        );

    const goalMinutes = goal.minutesPerDay.reduce((sum, value) => sum + value, 0);
    const metGoal = weekSummary.minutesSpent >= goalMinutes;
    let Icon = inProgress ? HourglassBottom : Close;
    if (metGoal) {
        Icon = CheckCircle;
    }

    return (
        <Stack alignItems='center'>
            <Typography variant='caption'>
                {startDateStr} — {weekSummary.date}
            </Typography>
            <Divider sx={{ width: 1 }} />

            <Stack
                direction='row'
                justifyContent='space-between'
                alignItems='center'
                width={1}
                columnGap={1}
            >
                <Stack direction='row' alignItems='center' columnGap={0.5}>
                    <Icon
                        width={12}
                        height={12}
                        sx={{
                            fontSize: '14px',
                            color: metGoal
                                ? 'success.main'
                                : inProgress
                                  ? 'text.secondary'
                                  : 'error.main',
                        }}
                    />
                    <Typography variant='caption' pt='2px'>
                        {metGoal ? 'Met' : !inProgress ? 'Missed' : ''} Weekly Goal
                    </Typography>
                </Stack>

                <Typography variant='caption' pt='2px'>
                    {formatTime(weekSummary.minutesSpent)} / {formatTime(goalMinutes)}
                </Typography>
            </Stack>

            {weekSummary.graduation && (
                <Stack
                    direction='row'
                    justifyContent='space-between'
                    alignItems='center'
                    columnGap='1rem'
                    width={1}
                >
                    <Stack direction='row' alignItems='center' columnGap={0.5}>
                        <CohortIcon tooltip='' cohort={weekSummary.graduation} size={12} />
                        <Typography variant='caption' pt='2px'>
                            Graduated from {weekSummary.graduation}
                        </Typography>
                    </Stack>
                </Stack>
            )}

            {weekSummary.gamePlayed && (
                <Stack
                    direction='row'
                    justifyContent='space-between'
                    alignItems='center'
                    columnGap='1rem'
                    width={1}
                >
                    <Stack direction='row' alignItems='center' columnGap={0.5}>
                        <GiCrossedSwords />
                        <Typography variant='caption' pt='2px'>
                            Classical Game Played
                        </Typography>
                    </Stack>
                </Stack>
            )}

            {categories.map(([category, count]) => {
                const rows = [
                    { category, count: count[field].trainingPlan },
                    {
                        category: `${category} (Custom)`,
                        count: count[field].custom,
                        striped: true,
                    },
                ]
                    .filter((x) => x.count)
                    .sort((x, y) => y.count - x.count);

                return rows.map((row) => (
                    <TooltipRow
                        key={row.category}
                        category={row.category}
                        field={field}
                        count={row.count}
                        backgroundColor={CategoryColors[category as RequirementCategory]}
                        striped={row.striped}
                    />
                ));
            })}
        </Stack>
    );
}

function TooltipRow({
    category,
    backgroundColor,
    field,
    count,
    striped,
}: {
    category: string;
    backgroundColor: string;
    field: TimelineEntryField;
    count: number;
    striped?: boolean;
}) {
    return (
        <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='center'
            columnGap='1rem'
            width={1}
        >
            <Stack direction='row' alignItems='center' columnGap={0.5}>
                <svg width='12' height='12'>
                    <g>
                        <rect
                            width='12'
                            height='12'
                            rx='2'
                            ry='2'
                            style={{ fill: backgroundColor }}
                        />
                        {striped && (
                            <>
                                <StripePattern />
                                <rect width='12' height='12' fill='url(#diagonalHatch)' />
                            </>
                        )}
                    </g>
                </svg>

                <Typography variant='caption' pt='2px'>
                    {displayRequirementCategory(category as RequirementCategory)}
                </Typography>
            </Stack>

            <Typography variant='caption' pt='2px'>
                {field === 'dojoPoints'
                    ? `${Math.round(10 * count) / 10} Dojo point${count !== 1 ? 's' : ''}`
                    : formatTime(count)}
            </Typography>
        </Stack>
    );
}

/**
 * Renders a tooltip for the legend.
 * @param block The block element of the legend.
 * @param level The level of the element.
 * @param clamp The max count for the activity heatmap.
 * @param field The field (dojo points/minutes) displayed by the heatmap.
 * @returns A tooltip wrapping the block.
 */
function LegendTooltip({
    block,
    level,
    clamp,
    field,
}: {
    block: BlockElement;
    level: number;
    clamp: number;
    field: TimelineEntryField;
}) {
    let value = '';
    const minValue = Math.max(0, (clamp / (MAX_LEVEL - 1)) * (level - 1));
    if (field === 'minutesSpent') {
        value = formatTime(minValue);
    } else {
        value = `${Math.round(minValue * 100) / 100}`;
    }

    if (level === 0) {
        if (field === 'dojoPoints') {
            value += ' Dojo points';
        }
    } else if (level < MAX_LEVEL) {
        const maxValue = (clamp / (MAX_LEVEL - 1)) * level;
        if (field === 'minutesSpent') {
            value += ` – ${formatTime(maxValue)}`;
        } else {
            value += ` – ${Math.round(maxValue * 100) / 100} Dojo points`;
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
    const mixFactor = level / MAX_LEVEL;
    return mixColors(from, to, mixFactor);
}

/**
 * Mixes two colors by the given proportion. Manually recreates CSS color-mix, as it
 * is unavailable in older browsers.
 * @param color1 The first color to mix in hex.
 * @param color2 The second color to mix in hex.
 * @param weight The proportion of color2 in the mix. Specified as a decimal.
 * @returns A new hex color representing the mix.
 */
function mixColors(color1: string, color2: string, weight: number) {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);

    if (!rgb2) {
        return color1;
    }
    if (!rgb1) {
        return color2;
    }
    const mixedRgb = {
        r: Math.round(rgb1?.r * (1 - weight) + rgb2.r * weight),
        g: Math.round(rgb1?.g * (1 - weight) + rgb2.g * weight),
        b: Math.round(rgb1?.b * (1 - weight) + rgb2.b * weight),
    };
    return rgbToHex(mixedRgb);
}

/**
 * Converts the given hex color to RGB.
 * @param hex The hex color to convert.
 * @returns The RGB components of the color.
 */
function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
          }
        : null;
}

/**
 * Converts the given RGB color to hex.
 * @param rgb The RGB color to convert.
 * @returns The hex code of the color.
 */
function rgbToHex(rgb: { r: number; g: number; b: number }) {
    return `#${((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1)}`;
}

/** Renders a stripe pattern for use in SVGs. */
function StripePattern() {
    return (
        <pattern id='diagonalHatch' patternUnits='userSpaceOnUse' width='4' height='4'>
            <path
                d='M-1,1 l2,-2
M0,4 l4,-4
M3,5 l2,-2'
                style={{ stroke: 'black', strokeWidth: 1 }}
            />
        </pattern>
    );
}
