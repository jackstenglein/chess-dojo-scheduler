import { useAuth } from '@/auth/Auth';
import { getTimeZonedDate } from '@/calendar/displayDate';
import { formatTime, RequirementCategory } from '@/database/requirement';
import { TimelineEntry, TimelineSpecialRequirementId } from '@/database/timeline';
import { User } from '@/database/user';
import CohortIcon, { cohortIcons } from '@/scoreboard/CohortIcon';
import { CategoryColors } from '@/style/ThemeProvider';
import { useLightMode } from '@/style/useLightMode';
import {
    Box,
    Checkbox,
    Divider,
    FormControlLabel,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { cloneElement, useEffect, useMemo, useState } from 'react';
import {
    ActivityCalendar,
    Activity as BaseActivity,
    BlockElement,
} from 'react-activity-calendar';
import { GiCrossedSwords } from 'react-icons/gi';
import { HeatmapOptions, TimelineEntryField, useHeatmapOptions } from './HeatmapOptions';

interface CategoryCount {
    /** The count of the category spent on custom tasks. */
    custom: number;

    /** The count of the category spent on training plan tasks. */
    trainingPlan: number;
}

interface Activity extends BaseActivity {
    /** The count of the activity by category. */
    categoryCounts?: Partial<Record<RequirementCategory, CategoryCount>>;

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

/**
 * Renders the Heatmap, including the options and legend, for the given timeline entries.
 */
export function Heatmap({
    entries,
    description,
    blockSize,
    onPopOut,
    minDate,
    maxDate,
}: {
    entries: TimelineEntry[];
    description: string;
    blockSize?: number;
    onPopOut?: () => void;
    minDate?: string;
    maxDate?: string;
}) {
    const isLight = useLightMode();
    const { user: viewer } = useAuth();
    const [, setCalendarRef] = useState<HTMLElement | null>(null);
    const { field, colorMode, maxPoints, maxMinutes, weekStartOn } = useHeatmapOptions();
    const clamp = field === 'dojoPoints' ? maxPoints : maxMinutes;

    if (!maxDate) {
        maxDate = new Date().toISOString().split('T')[0];
    }
    if (!minDate) {
        minDate = `${parseInt(maxDate.split('-')[0]) - 1}${maxDate.slice(4)}`;
    }

    const { activities, totalCount } = useMemo(() => {
        return getActivity(entries, field, minDate, maxDate, viewer);
    }, [field, entries, minDate, maxDate, viewer]);

    useEffect(() => {
        const scroller = document.getElementsByClassName(
            'react-activity-calendar__scroll-container',
        )[0];
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
                },
                '& .react-activity-calendar__footer': {
                    marginLeft: '0 !important',
                },
            }}
        >
            <HeatmapOptions onPopOut={onPopOut} />

            <ActivityCalendar
                ref={setCalendarRef}
                colorScheme={isLight ? 'light' : 'dark'}
                theme={{
                    dark: ['#393939', MONOCHROME_COLOR],
                    light: ['#EBEDF0', MONOCHROME_COLOR],
                }}
                data={activities}
                renderBlock={(block, activity) =>
                    colorMode === 'monochrome' ? (
                        <MonochromeBlock
                            block={block}
                            activity={activity as Activity}
                            field={field}
                            baseColor={isLight ? '#EBEDF0' : '#393939'}
                            clamp={clamp}
                        />
                    ) : (
                        <Block
                            block={block}
                            activity={activity as Activity}
                            field={field}
                            baseColor={isLight ? '#EBEDF0' : '#393939'}
                            clamp={clamp}
                        />
                    )
                }
                labels={{
                    totalCount:
                        field === 'dojoPoints'
                            ? `{{count}} Dojo points ${description}`
                            : `${formatTime(totalCount)} ${description}`,
                }}
                totalCount={Math.round(10 * totalCount) / 10}
                maxLevel={MAX_LEVEL}
                showWeekdayLabels
                weekStart={weekStartOn}
                renderColorLegend={(block, level) => (
                    <LegendTooltip
                        key={level}
                        block={block}
                        level={level}
                        clamp={clamp}
                        field={field}
                    />
                )}
                blockSize={blockSize}
            />
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
                        onChange={(e) =>
                            setColorMode(e.target.checked ? 'monochrome' : 'standard')
                        }
                        sx={{ '& .MuiSvgIcon-root': { fontSize: '1rem' } }}
                    />
                }
                label='Single Color Mode'
                slotProps={{ typography: { variant: 'caption' } }}
            />

            {colorMode !== 'monochrome' && (
                <Stack
                    direction='row'
                    flexWrap='wrap'
                    columnGap={1}
                    rowGap={0.5}
                    mt={0.5}
                >
                    {VALID_TOOLTIP_CATEGORIES.map((category) => {
                        const color = CategoryColors[category];
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
 * @param field The field to extract from each timeline entry.
 * @param minDate The minimum allowed date for the heatmap.
 * @param maxDate The maximum allowed date for the heatmap.
 * @param viewer The user viewing the site. Used for calculating timezones.
 * @returns A list of activities and the total count.
 */
function getActivity(
    entries: TimelineEntry[],
    field: TimelineEntryField,
    minDate: string,
    maxDate: string,
    viewer?: User,
): { activities: Activity[]; totalCount: number } {
    const activities: Record<string, Activity> = {};
    let totalCount = 0;

    for (const entry of entries) {
        if (entry[field] < 0 || !VALID_CATEGORIES.includes(entry.requirementCategory)) {
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
            categoryCounts: {},
        };

        if (entry.requirementId === CLASSICAL_GAMES_REQUIREMENT_ID) {
            activity.gamePlayed = true;
        }
        if (
            entry.requirementId === TimelineSpecialRequirementId.Graduation &&
            (!activity.graduation ||
                parseInt(activity.graduation) < parseInt(entry.cohort))
        ) {
            activity.graduation = entry.cohort;
        }

        activity.count += entry[field];
        if (activity.categoryCounts) {
            const category = activity.categoryCounts[entry.requirementCategory] || {
                custom: 0,
                trainingPlan: 0,
            };
            if (entry.isCustomRequirement) {
                category.custom += entry[field];
            } else {
                category.trainingPlan += entry[field];
            }
            activity.categoryCounts[entry.requirementCategory] = category;
        }

        totalCount += entry[field];
        activities[dateStr] = activity;
    }

    if (!activities[minDate]) {
        activities[minDate] = {
            date: minDate,
            count: 0,
            level: 0,
            categoryCounts: {},
        };
    }

    if (!activities[maxDate]) {
        activities[maxDate] = {
            date: maxDate,
            count: 0,
            level: 0,
            categoryCounts: {},
        };
    }

    return {
        activities: Object.values(activities).sort((lhs, rhs) =>
            lhs.date.localeCompare(rhs.date),
        ),
        totalCount,
    };
}

/**
 * Renders a block in the heatmap.
 * @param block The block to render, as passed from React Activity Calendar.
 * @param activity The activity associated with the block.
 * @param field The field (dojo points/minutes) being displayed.
 * @param baseColor The level 0 color.
 * @param clamp The maximum count used for determining color level.
 * @returns A block representing the given activity.
 */
function Block({
    block,
    activity,
    field,
    baseColor,
    clamp,
}: {
    block: BlockElement;
    activity: Activity;
    field: TimelineEntryField;
    baseColor: string;
    clamp: number;
}) {
    let maxCategory: RequirementCategory | undefined = undefined;
    let totalCount = 0;
    let maxCount: number | undefined = undefined;
    let color: string | undefined = undefined;
    let isCustom = false;

    for (const category of Object.values(RequirementCategory)) {
        const count = activity.categoryCounts?.[category as RequirementCategory];
        if (!count) {
            continue;
        }

        totalCount += count.custom + count.trainingPlan;
        if (maxCount === undefined || count.custom + count.trainingPlan > maxCount) {
            maxCategory = category as RequirementCategory;
            maxCount = count.custom + count.trainingPlan;
        }
    }

    if (maxCount && maxCategory) {
        const level = calculateLevel(totalCount, clamp);
        color = calculateColor([baseColor, CategoryColors[maxCategory]], level);
        isCustom =
            (activity.categoryCounts?.[maxCategory]?.custom ?? 0) >
            (activity.categoryCounts?.[maxCategory]?.trainingPlan ?? 0);
    }

    const newStyle = color ? { ...block.props.style, fill: color } : block.props.style;
    const icon = Boolean(activity.graduation || activity.gamePlayed);

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
                            ...(icon
                                ? { fill: 'transparent', stroke: 'transparent' }
                                : {}),
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
                            ...(icon
                                ? { fill: 'transparent', stroke: 'transparent' }
                                : {}),
                        },
                    })
                )}
            </Tooltip>
        </>
    );
}

/**
 * Renders a block in the heatmap for the monochrome view.
 * @param block The block to render, as passed from React Activity Calendar.
 * @param activity The activity associated with the block.
 * @param field The field (dojo points/minutes) being displayed.
 * @returns A block representing the given activity.
 */
function MonochromeBlock({
    block,
    activity,
    field,
    baseColor,
    clamp,
}: {
    block: BlockElement;
    activity: Activity;
    field: TimelineEntryField;
    baseColor: string;
    clamp: number;
}) {
    const level = calculateLevel(activity.count, clamp);
    const color = calculateColor([baseColor, MONOCHROME_COLOR], level);
    const style = color ? { ...block.props.style, fill: color } : block.props.style;

    return (
        <Tooltip
            disableInteractive
            title={<BlockTooltip activity={activity} field={field} />}
        >
            {cloneElement(block, { style })}
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
    if (count === 0) {
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
    activity: Activity;
    field: TimelineEntryField;
}) {
    const categories = Object.entries(activity.categoryCounts ?? {})
        .filter((entry) =>
            VALID_TOOLTIP_CATEGORIES.includes(entry[0] as RequirementCategory),
        )
        .sort(
            (lhs, rhs) =>
                rhs[1].custom +
                rhs[1].trainingPlan -
                (lhs[1].custom + lhs[1].trainingPlan),
        );

    return (
        <Stack alignItems='center'>
            <Typography variant='caption'>
                {field === 'dojoPoints'
                    ? `${Math.round(10 * activity.count) / 10} Dojo point${activity.count !== 1 ? 's' : ''} on ${activity.date}`
                    : `${formatTime(activity.count)} on ${activity.date}`}
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
                    { category, count: count.trainingPlan },
                    {
                        category: `${category} (Custom)`,
                        count: count.custom,
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
                    {category}
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
    const mixFactor = (level / MAX_LEVEL) * 100;
    return `color-mix(in oklab, ${to} ${parseFloat(mixFactor.toFixed(2))}%, ${from})`;
}

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
