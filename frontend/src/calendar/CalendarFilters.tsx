import { Stack, Typography, Divider, FormControlLabel, Checkbox } from '@mui/material';
import { useState } from 'react';
import { useAuth } from '../auth/Auth';
import { AvailabilityType, getDisplayString } from '../database/availability';
import { dojoCohorts } from '../database/user';

interface Filters {
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

    return {
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
    };
}

interface CalendarFiltersProps {
    filters: Filters;
}

export const CalendarFilters: React.FC<CalendarFiltersProps> = ({ filters }) => {
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

    return (
        <Stack sx={{ pt: 0.5 }} spacing={4}>
            <Stack>
                <Typography variant='h6' color='text.secondary'>
                    My Calendar (Blue)
                </Typography>
                <Divider />
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
            <Stack>
                <Typography variant='h6' color='text.secondary'>
                    Dojo Calendar (Red)
                </Typography>
                <Divider />
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
            </Stack>
        </Stack>
    );
};
