import {
    Stack,
    Typography,
    FormControlLabel,
    Checkbox,
    useMediaQuery,
    Select,
    MenuItem,
    FormControl,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { AvailabilityType, getDisplayString } from '../database/availability';
import { dojoCohorts } from '../database/user';

import { styled } from '@mui/material/styles';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import MuiAccordionSummary, {
    AccordionSummaryProps,
} from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import { useAuth } from '../auth/Auth';
import { useApi } from '../api/Api';

export const DefaultTimezone = 'DEFAULT';

const Accordion = styled((props: AccordionProps) => (
    <MuiAccordion disableGutters elevation={0} square {...props} />
))(() => ({
    '&:before': {
        display: 'none',
    },
}));

const AccordionSummary = styled(
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

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
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

    allTypes: boolean;
    setAllTypes: React.Dispatch<React.SetStateAction<boolean>>;

    types: Record<AvailabilityType, boolean>;
    setTypes: React.Dispatch<React.SetStateAction<Record<AvailabilityType, boolean>>>;

    allCohorts: boolean;
    setAllCohorts: React.Dispatch<React.SetStateAction<boolean>>;

    cohorts: Record<string, boolean>;
    setCohorts: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export function useFilters(): Filters {
    const user = useAuth().user!;

    const [timezone, setTimezone] = useState(user.timezoneOverride || DefaultTimezone);
    const [availabilities, setAvailabilities] = useState(true);
    const [meetings, setMeetings] = useState(true);

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

    const result = useMemo(
        () => ({
            timezone,
            setTimezone,
            availabilities,
            setAvailabilities,
            meetings,
            setMeetings,
            allTypes,
            setAllTypes,
            types,
            setTypes,
            allCohorts,
            setAllCohorts,
            cohorts,
            setCohorts,
        }),
        [
            timezone,
            setTimezone,
            availabilities,
            setAvailabilities,
            meetings,
            setMeetings,
            allTypes,
            setAllTypes,
            types,
            setTypes,
            allCohorts,
            setAllCohorts,
            cohorts,
            setCohorts,
        ]
    );

    return result;
}

function getTimezoneOptions() {
    const options = [];
    for (let i = -12; i <= 14; i++) {
        const displayLabel = i < 0 ? `UTC${i}` : `UTC+${i}`;
        const value = i <= 0 ? `Etc/GMT+${Math.abs(i)}` : `Etc/GMT-${i}`;
        options.push(
            <MenuItem key={i} value={value}>
                {displayLabel}
            </MenuItem>
        );
    }
    return options;
}

interface CalendarFiltersProps {
    filters: Filters;
}

export const CalendarFilters: React.FC<CalendarFiltersProps> = ({ filters }) => {
    const api = useApi();

    const [expanded, setExpanded] = useState<string | boolean>(false);
    const forceExpansion = useMediaQuery((theme: any) => theme.breakpoints.up('md'));

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

    const onChangeTimezone = (timezone: string) => {
        filters.setTimezone(timezone);
        api.updateUser({ timezoneOverride: timezone });
    };

    // Time in hours between UTC and local. The value is positive if the local time zone is
    // behind UTC and negative if the local time zone is ahead of UTC.
    const timezoneOffset = new Date().getTimezoneOffset() / 60;
    const browserDefaultLabel =
        timezoneOffset > 0 ? `UTC-${timezoneOffset}` : `UTC+${Math.abs(timezoneOffset)}`;

    return (
        <Stack sx={{ pt: 0.5, pb: 2 }} spacing={{ xs: 3, sm: 4 }}>
            <Stack>
                <Typography variant='h6' color='text.secondary' ml={1}>
                    Current Timezone
                </Typography>
                <FormControl size='small'>
                    <Select
                        value={filters.timezone}
                        onChange={(e) => onChangeTimezone(e.target.value)}
                    >
                        <MenuItem value={DefaultTimezone}>
                            Browser Default ({browserDefaultLabel})
                        </MenuItem>
                        {getTimezoneOptions()}
                    </Select>
                </FormControl>
            </Stack>
            <Accordion
                expanded={forceExpansion || expanded === 'myCalendar'}
                onChange={handleChange('myCalendar')}
            >
                <AccordionSummary
                    aria-controls='mycalendar-content'
                    id='mycalendar-header'
                    forceExpansion={forceExpansion}
                >
                    <Typography variant='h6' color='text.secondary'>
                        My Calendar (Blue)
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
                    aria-controls='dojocalendar-content'
                    id='dojocalendar-header'
                    forceExpansion={forceExpansion}
                >
                    <Typography variant='h6' color='text.secondary'>
                        Dojo Calendar (Red)
                    </Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Stack pt={2}>
                        <Typography variant='subtitle2' color='text.secondary'>
                            Meeting Types
                        </Typography>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={filters.allTypes}
                                    onChange={(event) =>
                                        filters.setAllTypes(event.target.checked)
                                    }
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
