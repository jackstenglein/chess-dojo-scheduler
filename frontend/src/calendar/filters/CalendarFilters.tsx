import React, { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Stack,
    Typography,
    FormControlLabel,
    Checkbox,
    useMediaQuery,
    Tooltip,
    Link,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import MuiAccordionSummary, {
    AccordionSummaryProps,
} from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';

import {
    AvailabilityType,
    PositionType,
    TimeControlType,
    TournamentType,
    displayTimeControlType,
    getDisplayString,
    Event,
    AvailabilityStatus,
} from '../../database/event';
import { dojoCohorts } from '../../database/user';
import { useAuth } from '../../auth/Auth';
import TimezoneFilter from './TimezoneFilter';
import { useEvents } from '../../api/cache/Cache';

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
    )
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

export interface Filters {
    timezone: string;
    setTimezone: React.Dispatch<React.SetStateAction<string>>;

    availabilities: boolean;
    setAvailabilities: React.Dispatch<React.SetStateAction<boolean>>;

    meetings: boolean;
    setMeetings: React.Dispatch<React.SetStateAction<boolean>>;

    dojoEvents: boolean;
    setDojoEvents: React.Dispatch<React.SetStateAction<boolean>>;

    allTypes: boolean;
    setAllTypes: React.Dispatch<React.SetStateAction<boolean>>;

    types: Record<AvailabilityType, boolean>;
    setTypes: React.Dispatch<React.SetStateAction<Record<AvailabilityType, boolean>>>;

    allCohorts: boolean;
    setAllCohorts: React.Dispatch<React.SetStateAction<boolean>>;

    cohorts: Record<string, boolean>;
    setCohorts: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;

    tournamentTypes: Record<TournamentType, boolean>;
    setTournamentTypes: React.Dispatch<
        React.SetStateAction<Record<TournamentType, boolean>>
    >;

    tournamentTimeControls: Record<TimeControlType, boolean>;
    setTournamentTimeControls: React.Dispatch<
        React.SetStateAction<Record<TimeControlType, boolean>>
    >;

    tournamentPositions: Record<PositionType, boolean>;
    setTournamentPositions: React.Dispatch<
        React.SetStateAction<Record<PositionType, boolean>>
    >;
}

export function useFilters(): Filters {
    const user = useAuth().user;

    const [timezone, setTimezone] = useState(user?.timezoneOverride || DefaultTimezone);
    const [availabilities, setAvailabilities] = useState(true);
    const [meetings, setMeetings] = useState(true);
    const [dojoEvents, setDojoEvents] = useState(true);

    const [allTypes, setAllTypes] = useState(true);
    const [types, setTypes] = useState<Record<AvailabilityType, boolean>>(
        Object.values(AvailabilityType).reduce((map, type) => {
            map[type] = false;
            return map;
        }, {} as Record<AvailabilityType, boolean>)
    );

    const [allCohorts, setAllCohorts] = useState(true);
    const [cohorts, setCohorts] = useState<Record<string, boolean>>(
        dojoCohorts.reduce((map, cohort) => {
            map[cohort] = false;
            return map;
        }, {} as Record<string, boolean>)
    );

    const [tournamentTypes, setTournamentTypes] = useState<
        Record<TournamentType, boolean>
    >(
        Object.values(TournamentType).reduce((map, type) => {
            map[type] = true;
            return map;
        }, {} as Record<TournamentType, boolean>)
    );

    const [tournamentTimeControls, setTournamentTimeControls] = useState<
        Record<TimeControlType, boolean>
    >(
        Object.values(TimeControlType).reduce((map, type) => {
            map[type] = true;
            return map;
        }, {} as Record<TimeControlType, boolean>)
    );

    const [tournamentPositions, setTournamentPositions] = useState(
        Object.values(PositionType).reduce((m, t) => {
            m[t] = true;
            return m;
        }, {} as Record<PositionType, boolean>)
    );

    const result = useMemo(
        () => ({
            timezone,
            setTimezone,
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
        }),
        [
            timezone,
            setTimezone,
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
        ]
    );

    return result;
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
        if (!e.participants || e.participants.length === 0) {
            return false;
        }
        if (
            e.owner !== auth.user?.username &&
            e.participants.every((p) => p.username !== auth.user?.username)
        ) {
            return false;
        }
        return e.status !== AvailabilityStatus.Canceled && e.endTime >= filterTime;
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

    return (
        <Stack
            data-cy='calendar-filters'
            sx={{ pt: 0.5, pb: 2 }}
            spacing={{ xs: 3, sm: 4 }}
        >
            <TimezoneFilter
                timezone={filters.timezone}
                setTimezone={filters.setTimezone}
            />

            {meetingCount > 0 && (
                <Link component={RouterLink} to='/meeting'>
                    View {meetingCount} upcoming meeting{meetingCount !== 1 ? 's' : ''}
                </Link>
            )}

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
                                                    event.target.checked
                                                )
                                            }
                                            disabled={!filters.dojoEvents}
                                            sx={{
                                                color: 'secondary.dark',
                                                '&.Mui-checked': {
                                                    color: 'secondary.dark',
                                                },
                                            }}
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
