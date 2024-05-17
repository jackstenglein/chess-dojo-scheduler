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
    PositionType,
    TimeControlType,
    TournamentType,
    displayTimeControlType,
    displayTournamentType,
} from '../database/event';
import Icon from '../style/Icon';
import { RequirementCategory } from '../database/requirement';

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
                        <Icon
                            name='liga'
                            sx={{ marginRight: '0.4rem', verticalAlign: 'middle' }}
                            fontSize='medium'
                            color='primary'
                        />
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
                                        color='secondary'
                                    />
                                }
                                label={
                                    <>
                                        <Icon
                                            name={displayTournamentType(type)}
                                            sx={{
                                                marginRight: '0.5rem',
                                                verticalAlign: 'middle',
                                            }}
                                            fontSize='small'
                                            color='primary'
                                        />

                                        {displayTournamentType(type)}
                                    </>
                                }
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
                        <Icon
                            name='tc'
                            sx={{ marginRight: '0.4rem', verticalAlign: 'middle' }}
                            fontSize='medium'
                            color='primary'
                        />
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
                                label={
                                    <>
                                        <Icon
                                            name={displayTimeControlType(type)}
                                            sx={{
                                                marginRight: '0.5rem',
                                                verticalAlign: 'middle',
                                            }}
                                            fontSize='small'
                                            color='primary'
                                        />

                                        {displayTimeControlType(type)}
                                    </>
                                }
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
                        <Icon
                            name={RequirementCategory.Endgame}
                            sx={{ marginRight: '0.4rem', verticalAlign: 'middle' }}
                            fontSize='medium'
                            color='primary'
                        />
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
                                        color='error'
                                    />
                                }
                                label={
                                    <>
                                        <Icon
                                            name={displayPositionType(type)}
                                            sx={{
                                                marginRight: '0.5rem',
                                                verticalAlign: 'middle',
                                            }}
                                            fontSize='small'
                                            color='primary'
                                        />

                                        {displayPositionType(type)}
                                    </>
                                }
                            />
                        ))}
                    </Stack>
                </AccordionDetails>
            </Accordion>
        </Stack>
    );
};

export default TournamentCalendarFilters;
