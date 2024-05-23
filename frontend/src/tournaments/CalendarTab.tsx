import { Scheduler } from '@aldabil/react-scheduler';
import {
    EventRendererProps,
    ProcessedEvent,
    SchedulerRef,
} from '@aldabil/react-scheduler/types';
import { Grid } from '@mui/material';
import { useEffect, useMemo, useRef } from 'react';
import { useEvents } from '../api/cache/Cache';
import { CustomEventRenderer } from '../calendar/CalendarPage';
import ProcessedEventViewer from '../calendar/eventViewer/ProcessedEventViewer';
import {
    DefaultTimezone,
    Filters,
    getHours,
    useFilters,
} from '../calendar/filters/CalendarFilters';
import {
    Event,
    EventType,
    PositionType,
    TimeControlType,
    TournamentType,
} from '../database/event';
import { TimeFormat } from '../database/user';
import TournamentCalendarFilters from './TournamentCalendarFilters';

function getColor(timeControlType: TimeControlType) {
    switch (timeControlType) {
        case TimeControlType.AllTimeContols:
            return 'primary';
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
            filters.tournamentTypes[0] !== TournamentType.AllTournamentTypes &&
            !filters.tournamentTypes.includes(event.ligaTournament.type)
        ) {
            continue;
        }

        if (
            filters.tournamentTimeControls[0] !== TimeControlType.AllTimeContols &&
            !filters.tournamentTimeControls.includes(event.ligaTournament.timeControlType)
        ) {
            continue;
        }

        if (
            filters.tournamentPositions[0] !== PositionType.AllPositions &&
            !filters.tournamentPositions.includes(PositionType.Custom) &&
            event.ligaTournament.fen
        ) {
            continue;
        }
        if (
            filters.tournamentPositions[0] !== PositionType.AllPositions &&
            !filters.tournamentPositions.includes(PositionType.Standard) &&
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
        calendarRef.current?.scheduler.handleState(
            (props: EventRendererProps) =>
                CustomEventRenderer({
                    ...props,
                    timeFormat: filters.timeFormat,
                }),
            'eventRenderer',
        );
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
                    eventRenderer={(props) =>
                        CustomEventRenderer({ ...props, timeFormat: filters.timeFormat })
                    }
                />
            </Grid>
        </Grid>
    );
};

export default CalendarTab;
