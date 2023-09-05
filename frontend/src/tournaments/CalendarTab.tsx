import { useEffect, useMemo, useRef } from 'react';
import { ProcessedEvent, SchedulerRef } from '@aldabil/react-scheduler/types';
import { Scheduler } from '@aldabil/react-scheduler';
import { Grid } from '@mui/material';

import ProcessedEventViewer from '../calendar/ProcessedEventViewer';
import {
    DefaultTimezone,
    useFilters,
    Filters,
} from '../calendar/filters/CalendarFilters';
import TournamentCalendarFilters from './TournamentCalendarFilters';
import { useEvents } from '../api/cache/Cache';
import { Event, EventType, TimeControlType } from '../database/event';

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
            !filters.tournamentTimeControls[event.ligaTournament.timeControlType]
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
                        startHour: 0,
                        endHour: 24,
                        navigation: true,
                    }}
                    week={{
                        weekDays: [0, 1, 2, 3, 4, 5, 6],
                        weekStartOn: 0,
                        startHour: 0,
                        endHour: 24,
                        step: 60,
                        navigation: true,
                    }}
                    day={{
                        startHour: 0,
                        endHour: 24,
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
                />
            </Grid>
        </Grid>
    );
};

export default CalendarTab;
