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
import React, { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { DayHours } from '@aldabil/react-scheduler/types';
import { useLocalStorage } from 'usehooks-ts';
import { useEvents } from '../../api/cache/Cache';
import { useAuth } from '../../auth/Auth';
import {
    AvailabilityType,
    displayTimeControlType,
    Event,
    EventStatus,
    getDisplayString,
    PositionType,
    TimeControlType,
    TournamentType,
} from '../../database/event';
import { dojoCohorts, TimeFormat } from '../../database/user';
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

const initialFilterTypes = Object.values(AvailabilityType).reduce(
    (map, type) => {
        map[type] = false;
        return map;
    },
    {} as Record<AvailabilityType, boolean>,
);

const initialFilterCohorts = dojoCohorts.reduce(
    (map, cohort) => {
        map[cohort] = false;
        return map;
    },
    {} as Record<string, boolean>,
);

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

    minHour: Date | null;
    setMinHour: (d: Date | null) => void;

    maxHour: Date | null;
    setMaxHour: (d: Date | null) => void;

    availabilities: boolean;
    setAvailabilities: (v: boolean) => void;

    meetings: boolean;
    setMeetings: (v: boolean) => void;

    dojoEvents: boolean;
    setDojoEvents: (v: boolean) => void;

    allTypes: boolean;
    setAllTypes: (v: boolean) => void;

    types: Record<AvailabilityType, boolean>;
    setTypes: (v: Record<AvailabilityType, boolean>) => void;

    allCohorts: boolean;
    setAllCohorts: (v: boolean) => void;

    cohorts: Record<string, boolean>;
    setCohorts: (v: Record<string, boolean>) => void;

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
    const [minHour, setMinHour] = useLocalStorage<Date | null>(
        'calendarFilters.minHour',
        new Date(new Date().setHours(0)),
        { deserializer: (v) => new Date(JSON.parse(v)) },
    );
    const [maxHour, setMaxHour] = useLocalStorage<Date | null>(
        'calendarFilters.maxHour',
        new Date(new Date().setHours(23)),
        { deserializer: (v) => new Date(JSON.parse(v)) },
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

    const [allTypes, setAllTypes] = useLocalStorage('calendarFilters.allTypes', true);
    const [types, setTypes] = useLocalStorage(
        'calendarFilters.types',
        initialFilterTypes,
    );

    const [allCohorts, setAllCohorts] = useLocalStorage(
        'calendarFilters.allCohorts',
        true,
    );
    const [cohorts, setCohorts] = useLocalStorage(
        'calendarFilters.cohorts',
        initialFilterCohorts,
    );

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
            allTypes,
            setAllTypes,
            types,
            setTypes,
            allCohorts,
            setAllCohorts,
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
            allTypes,
            setAllTypes,
            types,
            setTypes,
            allCohorts,
            setAllCohorts,
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
    minDate: Date | null,
    maxDate: Date | null,
): [DayHours, DayHours] {
    let minHour = minDate?.getHours() || 0;
    let maxHour = (maxDate?.getHours() || 23) + 1;

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
        (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
            if (!forceExpansion) {
                setExpanded(newExpanded ? panel : false);
            }
        };

    const onChangeType = (type: AvailabilityType, value: boolean) => {
        filters.setTypes({
            ...filters.types,
            [type]: value,
        });
    };

    const onChangeCohort = (cohort: string, value: boolean) => {
        filters.setCohorts({
            ...filters.cohorts,
            [cohort]: value,
        });
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
        filters.setAllTypes(true);
        filters.setTypes(initialFilterTypes);
        filters.setAllCohorts(true);
        filters.setCohorts(initialFilterCohorts);
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
            <TimezoneFilter
                timezone={filters.timezone}
                setTimezone={filters.setTimezone}
                timeFormat={filters.timeFormat}
                setTimeFormat={filters.setTimeFormat}
                minHour={filters.minHour}
                setMinHour={filters.setMinHour}
                maxHour={filters.maxHour}
                setMaxHour={filters.setMaxHour}
            />

            {meetingCount > 0 && (
                <Link component={RouterLink} to='/meeting'>
                    View {meetingCount} upcoming meeting{meetingCount !== 1 ? 's' : ''}
                </Link>
            )}

            <Button variant='outlined' onClick={onReset} sx={{ alignSelf: 'start' }}>
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
                                />
                            }
                            label='Availabilities'
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={filters.meetings}
                                    onChange={(event) =>
                                        filters.setMeetings(event.target.checked)
                                    }
                                />
                            }
                            label='Meetings'
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
                                color='success'
                            />
                        }
                        label='Dojo Events'
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
                        label='Coaching Sessions'
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
                            <Typography variant='subtitle2' color='text.secondary'>
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
                                            color='warning'
                                        />
                                    }
                                    label={displayTimeControlType(type)}
                                />
                            ))}
                        </Stack>
                    </Tooltip>

                    <Stack pt={2}>
                        <Typography variant='h6' color='text.secondary'>
                            Meetings
                        </Typography>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={filters.allTypes}
                                    onChange={(event) =>
                                        filters.setAllTypes(event.target.checked)
                                    }
                                    sx={{
                                        color: 'error.dark',
                                        '&.Mui-checked': {
                                            color: 'error.dark',
                                        },
                                    }}
                                />
                            }
                            label='All Types'
                        />
                        {Object.values(AvailabilityType).map((type) => (
                            <FormControlLabel
                                key={type}
                                control={
                                    <Checkbox
                                        checked={filters.allTypes || filters.types[type]}
                                        onChange={(event) =>
                                            onChangeType(type, event.target.checked)
                                        }
                                        sx={{
                                            color: 'error.dark',
                                            '&.Mui-checked:not(.Mui-disabled)': {
                                                color: 'error.dark',
                                            },
                                        }}
                                    />
                                }
                                disabled={filters.allTypes}
                                label={getDisplayString(type)}
                            />
                        ))}
                    </Stack>
                    <Stack pt={2}>
                        <Typography variant='subtitle2' color='text.secondary'>
                            Cohorts
                        </Typography>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={filters.allCohorts}
                                    onChange={(event) =>
                                        filters.setAllCohorts(event.target.checked)
                                    }
                                    sx={{
                                        color: 'error.dark',
                                        '&.Mui-checked:not(.Mui-disabled)': {
                                            color: 'error.dark',
                                        },
                                    }}
                                />
                            }
                            label='All Cohorts'
                        />
                        {dojoCohorts.map((cohort) => (
                            <FormControlLabel
                                key={cohort}
                                control={
                                    <Checkbox
                                        checked={
                                            filters.allCohorts || filters.cohorts[cohort]
                                        }
                                        onChange={(event) =>
                                            onChangeCohort(cohort, event.target.checked)
                                        }
                                        sx={{
                                            color: 'error.dark',
                                            '&.Mui-checked:not(.Mui-disabled)': {
                                                color: 'error.dark',
                                            },
                                        }}
                                    />
                                }
                                disabled={filters.allCohorts}
                                label={cohort}
                            />
                        ))}
                    </Stack>
                </AccordionDetails>
            </Accordion>
        </Stack>
    );
};
