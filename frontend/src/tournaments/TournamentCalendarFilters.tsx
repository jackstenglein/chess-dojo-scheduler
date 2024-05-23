import { Stack, Typography, useMediaQuery } from '@mui/material';
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
    displayPositionType,
    displayTimeControlType,
    displayTournamentType,
} from '../database/event';
import { RequirementCategory } from '../database/requirement';
import MultipleSelectChip from '../newsfeed/list/MultipleSelectChip';
import Icon from '../style/Icon';

function getColor(timeControlType: TimeControlType) {
    switch (timeControlType) {
        case TimeControlType.AllTimeContols:
            return 'primary';
        case TimeControlType.Blitz:
            return 'warning';
        case TimeControlType.Rapid:
            return 'info';
        case TimeControlType.Classical:
            return 'success';
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

    const onChangeTournamentTimeControls = (tcTypes: string[]) => {
        const addedTcTypes = tcTypes.filter(
            (tc) => !filters.tournamentTimeControls.includes(tc as TimeControlType),
        );

        let findTcTypes = [];
        if (addedTcTypes.includes(TimeControlType.AllTimeContols)) {
            findTcTypes = [TimeControlType.AllTimeContols];
        } else {
            findTcTypes = tcTypes.filter((tc) => tc !== TimeControlType.AllTimeContols);
        }

        filters.setTournamentTimeControls(findTcTypes as TimeControlType[]);
    };

    const onChangeTournamentType = (tourneyTypes: string[]) => {
        const addedTourney = tourneyTypes.filter(
            (tu) => !filters.tournamentTypes.includes(tu as TournamentType),
        );

        let findTourneyTypes = [];
        if (addedTourney.includes(TournamentType.ALLTournamentTypes)) {
            findTourneyTypes = [TournamentType.ALLTournamentTypes];
        } else {
            findTourneyTypes = tourneyTypes.filter(
                (tu) => tu !== TournamentType.ALLTournamentTypes,
            );
        }

        filters.setTournamentTypes(findTourneyTypes as TournamentType[]);
    };

    const onChangeTournamentPositions = (posTypes: string[]) => {
        const addedpos = posTypes.filter(
            (pos) => !filters.tournamentPositions.includes(pos as PositionType),
        );

        let findPosTypes = [];
        if (addedpos.includes(PositionType.AllPositions)) {
            findPosTypes = [PositionType.AllPositions];
        } else {
            findPosTypes = posTypes.filter((pos) => pos !== PositionType.AllPositions);
        }

        filters.setTournamentPositions(findPosTypes as PositionType[]);
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
                            color='liga'
                        />
                        Types
                    </Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Stack>
                        <MultipleSelectChip
                            selected={filters.tournamentTypes}
                            setSelected={onChangeTournamentType}
                            options={Object.values(TournamentType).map((t) => ({
                                value: t,
                                label: displayTournamentType(t),
                                icon: <Icon name={t} color='liga' />,
                            }))}
                            size='small'
                        />
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
                        <MultipleSelectChip
                            selected={filters.tournamentTimeControls}
                            setSelected={onChangeTournamentTimeControls}
                            options={Object.values(TimeControlType).map((t) => ({
                                value: t,
                                label: displayTimeControlType(t),
                                icon: <Icon name={t} color={getColor(t)} />,
                            }))}
                            size='small'
                        />
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
                            color='warning'
                        />
                        Starting Position
                    </Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Stack>
                        <MultipleSelectChip
                            selected={filters.tournamentPositions}
                            setSelected={onChangeTournamentPositions}
                            options={Object.values(PositionType).map((t) => ({
                                value: t,
                                label: displayPositionType(t),
                                icon: <Icon name={t} color='warning' />,
                            }))}
                            size='small'
                        />
                        {/* {Object.values(PositionType).map((type) => (
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
                        ))} */}
                    </Stack>
                </AccordionDetails>
            </Accordion>
        </Stack>
    );
};

export default TournamentCalendarFilters;
