import { Scheduler } from '@aldabil/react-scheduler';
import { ProcessedEvent, SchedulerRef } from '@aldabil/react-scheduler/types';
import { Box, Grid } from '@mui/material';
import { useEffect, useMemo, useRef } from 'react';
import { useEvents } from '../api/cache/Cache';
import ProcessedEventViewer from '../calendar/eventViewer/ProcessedEventViewer';
import {
    DefaultTimezone,
    Filters,
    getHours,
    useFilters,
} from '../calendar/filters/CalendarFilters';
import { Event, EventType, PositionType, TimeControlType } from '../database/event';
import { TimeFormat } from '../database/user';
import Icon from '../style/Icon';
import TournamentCalendarFilters from './TournamentCalendarFilters';

function getColor(timeControlType: TimeControlType) {
    switch (timeControlType) {
        case TimeControlType.Blitz:
            return 'warning.main';
        case TimeControlType.Rapid:
            return 'info.main';
        case TimeControlType.Classical:
            return 'success.main';
    }
}

function getProcessedEvents(filters: Filters, events: Event[]): ProcessedEvent[] {
    const result: ProcessedEvent[] = [];

    for (const event of events) {
        if (event.type !== EventType.LigaTournament || !event.ligaTournament) {
            continue;
        }

        if (
            !filters.tournamentTypes[event.ligaTournament.type] ||
            !filters.tournamentTimeControls[0]
        ) {
            continue;
        }

        if (
            !filters.tournamentPositions[PositionType.Custom] &&
            event.ligaTournament.fen
        ) {
            continue;
        }
        if (
            !filters.tournamentPositions[PositionType.Standard] &&
            !event.ligaTournament.fen
        ) {
            continue;
        }

        result.push({
            event_id: event.id,
            title: event.title,
            start: new Date(event.startTime),
            end: new Date(event.endTime),
            color: getColor(event.ligaTournament.timeControlType),
            isOwner: false,
            event,
        });
    }

    return result;
}

const CalendarTab = () => {
    const calendarRef = useRef<SchedulerRef>(null);
    const { events } = useEvents();
    const filters = useFilters();

    const processedEvents = useMemo(() => {
        return getProcessedEvents(filters, events);
    }, [filters, events]);

    useEffect(() => {
        calendarRef.current?.scheduler.handleState(processedEvents, 'events');
    }, [processedEvents, calendarRef]);

    useEffect(() => {
        const timezone =
            filters.timezone === DefaultTimezone ? undefined : filters.timezone;
        console.log('Setting timezone: ', timezone);
        calendarRef.current?.scheduler.handleState(timezone, 'timeZone');
    }, [calendarRef, filters.timezone]);

    useEffect(() => {
        calendarRef.current?.scheduler.handleState(filters.timeFormat, 'hourFormat');
    }, [calendarRef, filters.timeFormat]);

    const [minHour, maxHour] = getHours(filters.minHour, filters.maxHour);

    useEffect(() => {
        calendarRef.current?.scheduler.handleState(
            {
                weekDays: [0, 1, 2, 3, 4, 5, 6],
                weekStartOn: 0,
                startHour: minHour,
                endHour: maxHour,
                navigation: true,
            },
            'month',
        );
        calendarRef.current?.scheduler.handleState(
            {
                weekDays: [0, 1, 2, 3, 4, 5, 6],
                weekStartOn: 0,
                startHour: minHour,
                endHour: maxHour,
                step: 60,
                navigation: true,
            },
            'week',
        );
        calendarRef.current?.scheduler.handleState(
            {
                startHour: minHour,
                endHour: maxHour,
                step: 60,
                navigation: true,
            },
            'day',
        );
    }, [calendarRef, minHour, maxHour]);

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={2.5}>
                <TournamentCalendarFilters filters={filters} />
            </Grid>

            <Grid item xs={12} md={9.5}>
                <Scheduler
                    ref={calendarRef}
                    editable={false}
                    deletable={false}
                    draggable={false}
                    month={{
                        weekDays: [0, 1, 2, 3, 4, 5, 6],
                        weekStartOn: 0,
                        startHour: minHour,
                        endHour: maxHour,
                        navigation: true,
                    }}
                    week={{
                        weekDays: [0, 1, 2, 3, 4, 5, 6],
                        weekStartOn: 0,
                        startHour: minHour,
                        endHour: maxHour,
                        step: 60,
                        navigation: true,
                    }}
                    day={{
                        startHour: minHour,
                        endHour: maxHour,
                        step: 60,
                        navigation: true,
                    }}
                    viewerExtraComponent={(_, event) => (
                        <ProcessedEventViewer processedEvent={event} />
                    )}
                    events={[]}
                    timeZone={
                        filters.timezone === DefaultTimezone
                            ? undefined
                            : filters.timezone
                    }
                    hourFormat={filters.timeFormat || TimeFormat.TwelveHour}
                    eventRenderer={({ event, ...props }) => {
                        return (
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    height: '100%',
                                    backgroundColor: event.color,
                                    color: 'cblack.main',
                                    fontSize: '0.775em',
                                }}
                                {...props}
                            >
                                <Box
                                    sx={{
                                        height: 90,
                                        background: event.color,
                                        color: 'cblack',
                                    }}
                                >
                                    <>
                                        <Icon
                                            name={
                                                event.event?.ligaTournament
                                                    ?.timeControlType
                                            }
                                            sx={{
                                                marginLeft: '0.3rem',
                                                verticalAlign: 'middle',
                                            }}
                                            color='cblack'
                                            fontSize='small'
                                        />

                                        <Icon
                                            name={
                                                event.event?.ligaTournament
                                                    ?.type
                                            }
                                            sx={{
                                                marginRight: '0.3rem',
                                                marginLeft: '0.3rem',
                                                verticalAlign: 'middle',
                                            }}
                                            color='cblack'
                                            fontSize='small'
                                        />
                                        {event.title}  <br />{' '}
                                        {event.start.toLocaleTimeString('en-US', {
                                            timeStyle: 'short',
                                        })}{' '}
                                        -{' '}
                                        {event.end.toLocaleTimeString('en-US', {
                                            timeStyle: 'short',
                                        })}

                                        
                                    </>
                                </Box>
                            </Box>
                        );
                    }}
                />
            </Grid>
        </Grid>
    );
};

export default CalendarTab;
