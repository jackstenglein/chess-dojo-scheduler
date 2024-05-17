import { DayHours } from '@aldabil/react-scheduler/types';
import { WeekDays } from '@aldabil/react-scheduler/views/Month';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import {
    Button,
    Checkbox,
    FormControlLabel,
    Link,
    Stack,
    Tooltip,
    Typography,
    useMediaQuery,
} from '@mui/material';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import MuiAccordionSummary, {
    AccordionSummaryProps,
} from '@mui/material/AccordionSummary';
import { styled } from '@mui/material/styles';
import { DateTime } from 'luxon';
import React, { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useLocalStorage } from 'usehooks-ts';
import { useEvents } from '../../api/cache/Cache';
import { useAuth } from '../../auth/Auth';
import {
    AvailabilityType,
    Event,
    EventStatus,
    PositionType,
    TimeControlType,
    TournamentType,
    displayTimeControlType,
    getDisplayString,
} from '../../database/event';
import {
    ALL_COHORTS,
    TimeFormat,
    compareCohorts,
    dojoCohorts,
} from '../../database/user';
import MultipleSelectChip from '../../newsfeed/list/MultipleSelectChip';
import CohortIcon from '../../scoreboard/CohortIcon';
import Icon from '../../style/Icon';
import TimezoneFilter from './TimezoneFilter';

export const DefaultTimezone = 'DEFAULT';

export const Accordion = styled((props: AccordionProps) => (
    <MuiAccordion disableGutters elevation={0} square {...props} />
))(() => ({
    '&:before': {
        display: 'none',
    },
}));

export const AccordionSummary = styled(
    ({
        forceExpansion,
        ...props
    }: AccordionSummaryProps & { forceExpansion: boolean }) => (
        <MuiAccordionSummary
            expandIcon={
                !forceExpansion && (
                    <ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />
                )
            }
            {...props}
        />
    ),
)(({ theme }) => ({
    paddingLeft: 0,
    border: 0,
    minHeight: 0,
    flexDirection: 'row-reverse',
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
        transform: 'rotate(90deg)',
    },
    '& .MuiAccordionSummary-content': {
        marginLeft: theme.spacing(1),
        marginTop: 0,
        marginBottom: 0,
    },
}));

export const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
    borderTop: '1px solid rgba(0, 0, 0, .125)',
    padding: 0,
    paddingLeft: theme.spacing(1),
}));

const initialFilterTournamentTypes = Object.values(TournamentType).reduce(
    (map, type) => {
        map[type] = true;
        return map;
    },
    {} as Record<TournamentType, boolean>,
);

const initialFilterTournamentTimeControls = Object.values(TimeControlType).reduce(
    (map, type) => {
        map[type] = true;
        return map;
    },
    {} as Record<TimeControlType, boolean>,
);

const initialFilterTournamentPositions = Object.values(PositionType).reduce(
    (m, t) => {
        m[t] = true;
        return m;
    },
    {} as Record<PositionType, boolean>,
);

export interface Filters {
    timezone: string;
    setTimezone: React.Dispatch<React.SetStateAction<string>>;

    timeFormat: TimeFormat;
    setTimeFormat: (format: TimeFormat) => void;

    weekStartOn: WeekDays;
    setWeekStartOn: (v: WeekDays) => void;

    minHour: DateTime | null;
    setMinHour: (d: DateTime | null) => void;

    maxHour: DateTime | null;
    setMaxHour: (d: DateTime | null) => void;

    availabilities: boolean;
    setAvailabilities: (v: boolean) => void;

    meetings: boolean;
    setMeetings: (v: boolean) => void;

    dojoEvents: boolean;
    setDojoEvents: (v: boolean) => void;

    types: AvailabilityType[];
    setTypes: (v: AvailabilityType[]) => void;

    cohorts: string[];
    setCohorts: (v: string[]) => void;

    tournamentTypes: Record<TournamentType, boolean>;
    setTournamentTypes: (v: Record<TournamentType, boolean>) => void;

    tournamentTimeControls: Record<TimeControlType, boolean>;
    setTournamentTimeControls: (v: Record<TimeControlType, boolean>) => void;

    tournamentPositions: Record<PositionType, boolean>;
    setTournamentPositions: (v: Record<PositionType, boolean>) => void;

    coaching: boolean;
    setCoaching: (v: boolean) => void;
}

export function useFilters(): Filters {
    const user = useAuth().user;

    const [timezone, setTimezone] = useState(user?.timezoneOverride || DefaultTimezone);
    const [timeFormat, setTimeFormat] = useState<TimeFormat>(
        user?.timeFormat || TimeFormat.TwelveHour,
    );
    const [weekStartOn, setWeekStartOn] = useLocalStorage<WeekDays>(
        'calendarFilters.weekStartOn',
        0,
    );
    const [minHour, setMinHour] = useLocalStorage<DateTime | null>(
        'calendarFilters.minHour',
        DateTime.now().set({ hour: 0 }),
        { deserializer: (v) => DateTime.fromISO(JSON.parse(v)) },
    );
    const [maxHour, setMaxHour] = useLocalStorage<DateTime | null>(
        'calendarFilters.maxHour',
        DateTime.now().set({ hour: 23 }),
        { deserializer: (v) => DateTime.fromISO(JSON.parse(v)) },
    );

    const [availabilities, setAvailabilities] = useLocalStorage(
        'calendarFilters.availabilties',
        true,
    );
    const [meetings, setMeetings] = useLocalStorage('calendarFilters.meetings', true);
    const [dojoEvents, setDojoEvents] = useLocalStorage(
        'calendarFilters.dojoEvents',
        true,
    );

    const [types, setTypes] = useLocalStorage('calendarFilters.types.2', [
        AvailabilityType.AllTypes,
    ]);

    const [cohorts, setCohorts] = useLocalStorage('calendarFilters.cohorts.2', [
        ALL_COHORTS,
    ]);

    const [tournamentTypes, setTournamentTypes] = useLocalStorage(
        'calendarFilters.tournamentTypes',
        initialFilterTournamentTypes,
    );

    const [tournamentTimeControls, setTournamentTimeControls] = useLocalStorage(
        'calendarFilters.tournamentTimeControls',
        initialFilterTournamentTimeControls,
    );

    const [tournamentPositions, setTournamentPositions] = useLocalStorage(
        'calendarFilters.tournamentPositions',
        initialFilterTournamentPositions,
    );

    const [coaching, setCoaching] = useLocalStorage('calendarFilters.coaching', true);

    const result = useMemo(
        () => ({
            timezone,
            setTimezone,
            timeFormat,
            setTimeFormat,
            weekStartOn,
            setWeekStartOn,
            minHour,
            setMinHour,
            maxHour,
            setMaxHour,
            availabilities,
            setAvailabilities,
            meetings,
            setMeetings,
            dojoEvents,
            setDojoEvents,
            types,
            setTypes,
            cohorts,
            setCohorts,
            tournamentTypes,
            setTournamentTypes,
            tournamentTimeControls,
            setTournamentTimeControls,
            tournamentPositions,
            setTournamentPositions,
            coaching,
            setCoaching,
        }),
        [
            timezone,
            setTimezone,
            timeFormat,
            setTimeFormat,
            weekStartOn,
            setWeekStartOn,
            minHour,
            setMinHour,
            maxHour,
            setMaxHour,
            availabilities,
            setAvailabilities,
            meetings,
            setMeetings,
            dojoEvents,
            setDojoEvents,
            types,
            setTypes,
            cohorts,
            setCohorts,
            tournamentTypes,
            setTournamentTypes,
            tournamentTimeControls,
            setTournamentTimeControls,
            tournamentPositions,
            setTournamentPositions,
            coaching,
            setCoaching,
        ],
    );

    return result;
}

/**
 * Returns the hours of the given minimum and maximum dates. If the dates are out of range,
 * the hours will be set to their default values.
 * @param minDate The minimum date.
 * @param maxDate The maximum date.
 * @returns The hours of the minimum and maximum dates.
 */
export function getHours(
    minDate: DateTime | null,
    maxDate: DateTime | null,
): [DayHours, DayHours] {
    let minHour = minDate?.hour || 0;
    let maxHour = (maxDate?.hour || 23) + 1;

    if (minHour < 0 || minHour > 23) {
        minHour = 0;
    }
    if (maxHour < 0 || maxHour > 24) {
        maxHour = 24;
    }
    if (minHour >= maxHour) {
        minHour = 0;
        maxHour = 24;
    }
    return [minHour as DayHours, maxHour as DayHours];
}

interface CalendarFiltersProps {
    filters: Filters;
}

export const CalendarFilters: React.FC<CalendarFiltersProps> = ({ filters }) => {
    const auth = useAuth();
    const [expanded, setExpanded] = useState<string | boolean>(false);
    const forceExpansion = useMediaQuery((theme: any) => theme.breakpoints.up('md'));

    const { events } = useEvents();
    const filterTime = new Date(new Date().getTime()).toISOString();
    const meetingCount = events.filter((e: Event) => {
        if (Object.values(e.participants).length === 0) {
            return false;
        }
        if (
            e.owner !== auth.user?.username &&
            !e.participants[auth.user?.username || '']
        ) {
            return false;
        }
        return e.status !== EventStatus.Canceled && e.endTime >= filterTime;
    }).length;

    const handleChange =
        (panel: string) => (_event: React.SyntheticEvent, newExpanded: boolean) => {
            if (!forceExpansion) {
                setExpanded(newExpanded ? panel : false);
            }
        };

    const onChangeType = (newTypes: string[]) => {
        const addedTypes = newTypes.filter(
            (t) => !filters.types.includes(t as AvailabilityType),
        );
        let finalTypes = [];
        if (addedTypes.includes(AvailabilityType.AllTypes)) {
            finalTypes = [AvailabilityType.AllTypes];
        } else {
            finalTypes = newTypes.filter((t) => t !== AvailabilityType.AllTypes);
        }

        filters.setTypes(finalTypes as AvailabilityType[]);
    };

    const onChangeCohort = (newCohorts: string[]) => {
        const addedCohorts = newCohorts.filter((c) => !filters.cohorts.includes(c));
        let finalCohorts = [];
        if (addedCohorts.includes(ALL_COHORTS)) {
            finalCohorts = [ALL_COHORTS];
        } else {
            finalCohorts = newCohorts
                .filter((c) => c !== ALL_COHORTS)
                .sort(compareCohorts);
        }

        filters.setCohorts(finalCohorts);
    };

    const onChangeTournamentTimeControls = (type: TimeControlType, value: boolean) => {
        filters.setTournamentTimeControls({
            ...filters.tournamentTimeControls,
            [type]: value,
        });
    };

    const onReset = () => {
        filters.setAvailabilities(true);
        filters.setMeetings(true);
        filters.setDojoEvents(true);
        filters.setTypes([AvailabilityType.AllTypes]);
        filters.setCohorts([ALL_COHORTS]);
        filters.setTournamentTypes(initialFilterTournamentTypes);
        filters.setTournamentTimeControls(initialFilterTournamentTimeControls);
        filters.setTournamentPositions(initialFilterTournamentPositions);
        filters.setCoaching(true);
    };

    return (
        <Stack
            data-cy='calendar-filters'
            sx={{ pt: 0.5, pb: 2 }}
            spacing={{ xs: 3, sm: 4 }}
        >
            {meetingCount > 0 && (
                <Link component={RouterLink} to='/meeting'>
                    View {meetingCount} upcoming meeting{meetingCount !== 1 ? 's' : ''}
                </Link>
            )}

            <TimezoneFilter filters={filters} />

            <Button
                variant='outlined'
                onClick={onReset}
                sx={{ alignSelf: 'start' }}
                startIcon={<Icon name='reset' />}
            >
                Reset Filters
            </Button>

            <Accordion
                expanded={forceExpansion || expanded === 'myCalendar'}
                onChange={handleChange('myCalendar')}
                id='my-calendar-filters'
            >
                <AccordionSummary
                    aria-controls='mycalendar-content'
                    id='mycalendar-header'
                    forceExpansion={forceExpansion}
                >
                    <Typography variant='h6' color='text.secondary'>
                        <Icon
                            name='eventCheck'
                            color='inherit'
                            sx={{ marginRight: '0.4rem', verticalAlign: 'middle' }}
                            fontSize='medium'
                        />
                        My Calendar
                    </Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Stack>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={filters.availabilities}
                                    onChange={(event) =>
                                        filters.setAvailabilities(event.target.checked)
                                    }
                                    color='info'
                                />
                            }
                            label={
                                <>
                                    <Icon
                                        name='avilb'
                                        color='inherit'
                                        sx={{
                                            marginRight: '0.4rem',
                                            verticalAlign: 'middle',
                                        }}
                                        fontSize='medium'
                                    />
                                    Availabilities
                                </>
                            }
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={filters.meetings}
                                    onChange={(event) =>
                                        filters.setMeetings(event.target.checked)
                                    }
                                    color='meet'
                                />
                            }
                            label={
                                <>
                                    <Icon
                                        name='meet'
                                        color='inherit'
                                        sx={{
                                            marginRight: '0.4rem',
                                            verticalAlign: 'middle',
                                        }}
                                        fontSize='medium'
                                    />
                                    Meetings
                                </>
                            }
                        />
                    </Stack>
                </AccordionDetails>
            </Accordion>

            <Accordion
                expanded={forceExpansion || expanded === 'dojoCalendar'}
                onChange={handleChange('dojoCalendar')}
            >
                <AccordionSummary
                    id='dojo-calendar-filters'
                    aria-controls='dojocalendar-content'
                    forceExpansion={forceExpansion}
                >
                    <Typography variant='h6' color='text.secondary'>
                        <Icon
                            name='eventCheck'
                            color='inherit'
                            sx={{ marginRight: '0.4rem', verticalAlign: 'middle' }}
                            fontSize='medium'
                        />
                        Dojo Calendar
                    </Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={filters.dojoEvents}
                                onChange={(event) =>
                                    filters.setDojoEvents(event.target.checked)
                                }
                                color='dojoOrange'
                            />
                        }
                        label={
                            <>
                                <Icon
                                    name='Dojo Events'
                                    color='inherit'
                                    sx={{
                                        marginRight: '0.4rem',
                                        verticalAlign: 'middle',
                                    }}
                                    fontSize='medium'
                                />
                                Dojo Events
                            </>
                        }
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={filters.coaching}
                                onChange={(event) =>
                                    filters.setCoaching(event.target.checked)
                                }
                                color='coaching'
                            />
                        }
                        label={
                            <>
                                <Icon
                                    name='Coaching Sessions'
                                    color='inherit'
                                    sx={{
                                        marginRight: '0.4rem',
                                        verticalAlign: 'middle',
                                    }}
                                    fontSize='medium'
                                />
                                Coaching Sessions
                            </>
                        }
                    />

                    <Tooltip
                        arrow
                        title={
                            filters.dojoEvents
                                ? ''
                                : 'Dojo Events must be enabled to view tournaments'
                        }
                    >
                        <Stack pt={2}>
                            <Typography variant='h6' color='text.secondary'>
                                <Icon
                                    name='liga'
                                    color='inherit'
                                    sx={{
                                        marginRight: '0.4rem',
                                        verticalAlign: 'middle',
                                    }}
                                    fontSize='medium'
                                />
                                Tournaments
                            </Typography>

                            {Object.values(TimeControlType).map((type) => (
                                <FormControlLabel
                                    key={type}
                                    control={
                                        <Checkbox
                                            checked={
                                                filters.dojoEvents &&
                                                filters.tournamentTimeControls[type]
                                            }
                                            onChange={(event) =>
                                                onChangeTournamentTimeControls(
                                                    type,
                                                    event.target.checked,
                                                )
                                            }
                                            disabled={!filters.dojoEvents}
                                            color='liga'
                                        />
                                    }
                                    label={
                                        <>
                                            <Icon
                                                name={displayTimeControlType(type)}
                                                color='inherit'
                                                sx={{
                                                    marginRight: '0.4rem',
                                                    verticalAlign: 'middle',
                                                }}
                                                fontSize='medium'
                                            />
                                            {displayTimeControlType(type)}
                                        </>
                                    }
                                />
                            ))}
                        </Stack>
                    </Tooltip>
                    <Stack pt={2} spacing={0.5}>
                        <Typography variant='h6' color='text.secondary'>
                            <Icon
                                name='meet'
                                color='book'
                                sx={{ marginRight: '0.4rem', verticalAlign: 'middle' }}
                                fontSize='medium'
                            />
                            Bookable Meetings
                        </Typography>
                        <MultipleSelectChip
                            selected={filters.types}
                            setSelected={onChangeType}
                            options={Object.values(AvailabilityType).map((t) => ({
                                value: t,
                                label: getDisplayString(t),
                                icon: <Icon name={t} />,
                            }))}
                            size='small'
                        />
                    </Stack>

                    <Stack mt={3} spacing={0.5}>
                        <Typography variant='h6' color='text.secondary'>
                            <Icon
                                name='cohort'
                                color='book'
                                sx={{ marginRight: '0.4rem', verticalAlign: 'middle' }}
                                fontSize='medium'
                            />
                            Cohorts
                        </Typography>
                        <MultipleSelectChip
                            data-cy='cohort-selector'
                            selected={filters.cohorts}
                            setSelected={onChangeCohort}
                            options={[ALL_COHORTS, ...dojoCohorts].map((opt) => ({
                                value: opt,
                                label: opt === ALL_COHORTS ? 'All Cohorts' : opt,
                                icon: (
                                    <CohortIcon
                                        cohort={opt}
                                        size={25}
                                        sx={{ marginRight: '0.6rem' }}
                                        tooltip=''
                                        color='primary'
                                    />
                                ),
                            }))}
                            sx={{ mb: 3, width: 1 }}
                            size='small'
                        />
                    </Stack>
                </AccordionDetails>
            </Accordion>
        </Stack>
    );
};
