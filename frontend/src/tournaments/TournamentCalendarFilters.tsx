import {
    Checkbox,
    FormControlLabel,
    Stack,
    Typography,
    useMediaQuery,
} from '@mui/material';
import { useState } from 'react';

import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Filters,
} from '../calendar/filters/CalendarFilters';
import TimezoneFilter from '../calendar/filters/TimezoneFilter';
import {
    displayTimeControlType,
    displayTournamentType,
    PositionType,
    TimeControlType,
    TournamentType,
} from '../database/event';

function getColor(timeControlType: TimeControlType) {
    switch (timeControlType) {
        case TimeControlType.Blitz:
            return 'warning';
        case TimeControlType.Rapid:
            return 'info';
        case TimeControlType.Classical:
            return 'success';
    }
}

function displayPositionType(type: PositionType): string {
    switch (type) {
        case PositionType.Standard:
            return 'Standard';
        case PositionType.Custom:
            return 'Custom';
    }
}

interface TournamentCalendarFiltersProps {
    filters: Filters;
}

export const TournamentCalendarFilters: React.FC<TournamentCalendarFiltersProps> = ({
    filters,
}) => {
    const [expanded, setExpanded] = useState<string | boolean>(false);
    const forceExpansion = useMediaQuery((theme: any) => theme.breakpoints.up('md'));

    const handleChange =
        (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
            if (!forceExpansion) {
                setExpanded(newExpanded ? panel : false);
            }
        };

    const onChangeTournamentType = (type: TournamentType, value: boolean) => {
        filters.setTournamentTypes({
            ...filters.tournamentTypes,
            [type]: value,
        });
    };

    const onChangeTournamentTimeControl = (type: TimeControlType, value: boolean) => {
        filters.setTournamentTimeControls({
            ...filters.tournamentTimeControls,
            [type]: value,
        });
    };

    const onChangeTournamentPositions = (type: PositionType, value: boolean) => {
        filters.setTournamentPositions({
            ...filters.tournamentPositions,
            [type]: value,
        });
    };

    return (
        <Stack
            data-cy='calendar-filters'
            sx={{ pt: 0.5, pb: 2, position: { md: 'sticky' }, top: { md: '88px' } }}
            spacing={{ xs: 3, sm: 4 }}
        >
            <TimezoneFilter filters={filters} />

            <Accordion
                expanded={forceExpansion || expanded === 'tournamentTypes'}
                onChange={handleChange('tournamentTypes')}
            >
                <AccordionSummary forceExpansion={forceExpansion}>
                    <Typography variant='h6' color='text.secondary'>
                        Types
                    </Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Stack>
                        {Object.values(TournamentType).map((type) => (
                            <FormControlLabel
                                key={type}
                                control={
                                    <Checkbox
                                        checked={filters.tournamentTypes[type]}
                                        onChange={(event) =>
                                            onChangeTournamentType(
                                                type,
                                                event.target.checked,
                                            )
                                        }
                                    />
                                }
                                label={displayTournamentType(type)}
                            />
                        ))}
                    </Stack>
                </AccordionDetails>
            </Accordion>

            <Accordion
                expanded={forceExpansion || expanded === 'timeControls'}
                onChange={handleChange('timeControls')}
            >
                <AccordionSummary forceExpansion={forceExpansion}>
                    <Typography variant='h6' color='text.secondary'>
                        Time Controls
                    </Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Stack>
                        {Object.values(TimeControlType).map((type) => (
                            <FormControlLabel
                                key={type}
                                control={
                                    <Checkbox
                                        checked={filters.tournamentTimeControls[type]}
                                        onChange={(event) =>
                                            onChangeTournamentTimeControl(
                                                type,
                                                event.target.checked,
                                            )
                                        }
                                        color={getColor(type)}
                                    />
                                }
                                label={displayTimeControlType(type)}
                            />
                        ))}
                    </Stack>
                </AccordionDetails>
            </Accordion>

            <Accordion
                expanded={forceExpansion || expanded === 'positions'}
                onChange={handleChange('positions')}
            >
                <AccordionSummary forceExpansion={forceExpansion}>
                    <Typography variant='h6' color='text.secondary'>
                        Starting Position
                    </Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Stack>
                        {Object.values(PositionType).map((type) => (
                            <FormControlLabel
                                key={type}
                                control={
                                    <Checkbox
                                        checked={filters.tournamentPositions[type]}
                                        onChange={(event) =>
                                            onChangeTournamentPositions(
                                                type,
                                                event.target.checked,
                                            )
                                        }
                                    />
                                }
                                label={displayPositionType(type)}
                            />
                        ))}
                    </Stack>
                </AccordionDetails>
            </Accordion>
        </Stack>
    );
};

export default TournamentCalendarFilters;
