import { getTimeZonedDate } from '@/calendar/displayDate';
import { formatTime, RequirementCategory } from '@/database/requirement';
import { TimelineEntry } from '@/database/timeline';
import { User } from '@/database/user';
import { CategoryColors } from '@/style/ThemeProvider';
import { WeekDays } from '@aldabil/react-scheduler/views/Month';
import { ZoomOutMap } from '@mui/icons-material';
import { Box, Divider, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { cloneElement, Dispatch, SetStateAction } from 'react';
import {
    ActivityCalendar,
    Activity as BaseActivity,
    BlockElement,
} from 'react-activity-calendar';
import { GiCrossedSwords } from 'react-icons/gi';
import { TimelineEntryField, View } from './HeatmapSelector';

interface Activity extends BaseActivity {
    /** The count of the activity by category. */
    categoryCounts?: Partial<Record<RequirementCategory, number>>;

    /** Whether a classical game was played on this date. */
    gamePlayed?: boolean;
}
/**
 * the max level count
 */
const MAX_LEVEL = 4;
/**
 * The min date for the heatmap
 */
const MIN_DATE = '2024-01-01';
/**
 * Classical game requirement ID used for classical game sword icon
 */
const CLASSICAL_GAMES_REQUIREMENT_ID = '38f46441-7a4e-4506-8632-166bcbe78baf';

/**
 * Valid categories for the heatmap to render like games, tactics etc
 */
const VALID_CATEGORIES = [
    RequirementCategory.Games,
    RequirementCategory.Tactics,
    RequirementCategory.Middlegames,
    RequirementCategory.Endgame,
    RequirementCategory.Opening,
    RequirementCategory.NonDojo,
];

/**
 * render heatmap for given attributes like calendarref, islight mode etc
 * @param setCalendarRef calendar ref @type Dispatch<SetStateAction<HTMLElement | null>>
 * @param isLight is light mode @type boolean
 * @param activities list of activities @type Activity
 * @param view the view mode @type View
 * @param field the timeline entry field @type TimelineEntryField
 * @param maxPointsCount the point count @type number
 * @param maxHoursCount the max hours count @type number
 * @param totalCount the total count @type number
 * @param maxCount the max count @type number
 * @param weekStartOn the week start on @type Weekdays
 * @returns view of heatmap
 */
export function renderHeatmap(
    setCalendarRef: Dispatch<SetStateAction<HTMLElement | null>>,
    isLight: boolean,
    activities: Activity[],
    view: View,
    field: TimelineEntryField,
    maxPointsCount: number,
    maxHoursCount: number,
    totalCount: number,
    maxCount: number,
    weekStartOn: WeekDays,
) {
    return (
        <ActivityCalendar
            ref={setCalendarRef}
            colorScheme={isLight ? 'light' : 'dark'}
            theme={{
                dark: ['#393939', '#6f02e3'],
                light: ['#EBEDF0', '#6f02e3'],
            }}
            data={activities}
            renderBlock={(block, activity) =>
                view === 'standard'
                    ? renderBlock(
                          block,
                          activity as Activity,
                          field,
                          isLight ? '#EBEDF0' : '#393939',
                          maxPointsCount,
                          maxHoursCount,
                      )
                    : renderStandardBlock(block, activity as Activity, field)
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
            hideColorLegend={view === 'task'}
            renderColorLegend={(block, level) =>
                renderLegendTooltip(block, level, maxCount, field)
            }
        />
    );
}

/**
 * renders heatmap under hood explanation
 * @param showOpen checking if modal is open and to hide pop out button @type boolean
 * @param setIsModalOpen method to set state action if view type is not a modal @type (value: SetStateAction<boolean>) => void
 * @returns view of heatmap explain card
 */

export function getHeatmapExplain(
    showOpen: boolean,
    setIsModalOpen: (value: SetStateAction<boolean>) => void,
) {
    return (
        <Stack direction='row' flexWrap='wrap' columnGap={1} rowGap={0.5} mt={0.5}>
            {Object.entries(CategoryColors).map(([category, color]) => {
                if (!VALID_CATEGORIES.includes(category as RequirementCategory)) {
                    return null;
                }

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
                        <Typography variant='caption' pt='2px'>
                            {category}
                        </Typography>
                    </Stack>
                );
            })}
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
                    {showOpen ? openHeatmap(setIsModalOpen, 24) : ''}
                </Stack>
            </Stack>
        </Stack>
    );
}

/**
 * handles opening heatmap from the popout button
 * @param setIsModalOpen method to set state action if view type is not a modal @type (value: SetStateAction<boolean>) => void
 * @param marginLeft the left margin value where button belongs @type number
 * @returns view of pop out button
 */
export function openHeatmap(
    setIsModalOpen: (value: SetStateAction<boolean>) => void,
    marginLeft: number,
) {
    return (
        <Stack>
            <Tooltip title='Pop out view'>
                <IconButton
                    color='primary'
                    onClick={() => setIsModalOpen(true)}
                    sx={{ mr: 0, ml: marginLeft }}
                    size='small'
                >
                    <ZoomOutMap />
                </IconButton>
            </Tooltip>
        </Stack>
    );
}

/**
 * Gets a list of activities and the total count for the given parameters.
 * @param entries The timeline entries to extract data from. @type TimelineEntry
 * @param field The field to extract from each timeline entry. @type TimelineEntryField
 * @param clamp The max value to use when calculating activity levels. @type number
 * @param viewer The user viewing the site. Used for calculating timezones. @type User
 * @returns A list of activities and the total count.
 */
export function getActivity(
    entries: TimelineEntry[],
    field: TimelineEntryField,
    clamp: number,
    viewer?: User,
): { activities: Activity[]; totalCount: number; maxCount: number } {
    const activities: Record<string, Activity> = {};
    let totalCount = 0;
    let maxCount = 0;

    for (const entry of entries) {
        if (entry[field] < 0 || !VALID_CATEGORIES.includes(entry.requirementCategory)) {
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

        if (entry.requirementId === CLASSICAL_GAMES_REQUIREMENT_ID) {
            activity.gamePlayed = true;
        }

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
 * @param block The block to render, as passed from React Activity Calendar. @type BlockElement
 * @param activity The activity associated with the block. @type Activity
 * @param field The field (dojo points/minutes) being displayed. @type TimelineEntryField
 * @param baseColor The level 0 color. @type string
 * @param MAX_POINTS_COUNT The max point count  @type number
 * @param MAX_HOURS_COUNT the max hours count @type number
 * @returns A block representing the given activity.
 */
function renderBlock(
    block: BlockElement,
    activity: Activity,
    field: TimelineEntryField,
    baseColor: string,
    MAX_POINTS_COUNT: number,
    MAX_HOURS_COUNT: number,
) {
    let maxCategory: RequirementCategory | undefined = undefined;
    let totalCount = 0;
    let maxCount: number | undefined = undefined;
    let color: string | undefined = undefined;

    for (const category of Object.values(RequirementCategory)) {
        const count = activity.categoryCounts?.[category as RequirementCategory];
        if (!count) {
            continue;
        }

        totalCount += count;
        if (maxCount === undefined || count > maxCount) {
            maxCategory = category as RequirementCategory;
            maxCount = count;
        }
    }

    if (maxCount && maxCategory) {
        const level = calculateLevel(
            totalCount,
            field === 'dojoPoints' ? MAX_POINTS_COUNT : MAX_HOURS_COUNT,
        );
        color = calculateColor([baseColor, CategoryColors[maxCategory]], level);
    }

    const newStyle = color ? { ...block.props.style, fill: color } : block.props.style;
    return (
        <>
            {activity.gamePlayed && (
                <GiCrossedSwords
                    x={block.props.x}
                    y={block.props.y}
                    width={block.props.width}
                    height={block.props.height}
                    fontSize='12px'
                />
            )}
            <Tooltip
                key={activity.date}
                disableInteractive
                title={renderTooltip(activity, field)}
            >
                {cloneElement(block, {
                    style: {
                        ...newStyle,
                        ...(activity.gamePlayed ? { fill: 'transparent' } : {}),
                    },
                })}
            </Tooltip>
        </>
    );
}

/**
 * Renders a block in the heatmap for the standard view.
 * @param block The block to render, as passed from React Activity Calendar. @type BlockElement
 * @param activity The activity associated with the block. @type Activity
 * @param field The field (dojo points/minutes) being displayed. @type TimelineEntryField
 * @returns A block representing the given activity.
 */
function renderStandardBlock(
    block: BlockElement,
    activity: Activity,
    field: TimelineEntryField,
) {
    return (
        <Tooltip disableInteractive title={renderTooltip(activity, field)}>
            {block}
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
 * Renders a tooltip for the given activity and field.
 * @param activity The activity for the given date. @type Activity
 * @param field The field (dojo points/minutes) being displayed. @type TimelineEntryField
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
 * @param block The block element of the legend. @type BlockElement
 * @param level The level of the element. @type number
 * @param maxCount The max count for the activity heatmap. @type number
 * @param field The field (dojo points/minutes) displayed by the heatmap. @type TimelineEntryField
 * @returns A tooltip wrapping the block.
 */
function renderLegendTooltip(
    block: BlockElement,
    level: number,
    maxCount: number,
    field: TimelineEntryField,
) {
    let value = '';
    const minValue = Math.max(0, (maxCount / (MAX_LEVEL - 1)) * (level - 1));
    if (field === 'minutesSpent') {
        value = formatTime(minValue);
    } else {
        value = `${minValue}`;
    }

    if (level === 0) {
        if (field === 'dojoPoints') {
            value += ' Dojo points';
        }
    } else if (level < MAX_LEVEL) {
        const maxValue = (maxCount / (MAX_LEVEL - 1)) * level;
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
 * @param colors The color scale to calculate. @type string list
 * @param level The level to get the color for. @type number
 */
function calculateColor(colors: [from: string, to: string], level: number): string {
    const [from, to] = colors;
    const mixFactor = (level / MAX_LEVEL) * 100;
    return `color-mix(in oklab, ${to} ${parseFloat(mixFactor.toFixed(2))}%, ${from})`;
}
