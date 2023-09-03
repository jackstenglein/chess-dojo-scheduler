import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Container, Grid } from '@mui/material';
import { Scheduler } from '@aldabil/react-scheduler';
import type { SchedulerRef } from '@aldabil/react-scheduler/types';
import { ProcessedEvent } from '@aldabil/react-scheduler/types';

import { useApi } from '../api/Api';
import AvailabilityEditor from './AvailabilityEditor';
import { RequestSnackbar, useRequest } from '../api/Request';
import { CalendarFilters, DefaultTimezone, Filters, useFilters } from './CalendarFilters';
import ProcessedEventViewer from './ProcessedEventViewer';
import { useEvents } from '../api/cache/Cache';
import { useAuth } from '../auth/Auth';
import { User } from '../database/user';
import { Event, EventType, AvailabilityStatus } from '../database/event';
import CalendarTutorial from './CalendarTutorial';

function processAvailability(
    user: User,
    filters: Filters,
    event: Event
): ProcessedEvent | null {
    if (event.status === AvailabilityStatus.Canceled) {
        return null;
    }

    // This user's joined meetings
    if (
        (event.owner === user.username ||
            event.participants!.some((p) => p.username === user.username)) &&
        event.participants!.length > 0
    ) {
        if (!filters.meetings) {
            return null;
        }

        const title =
            event.maxParticipants === 1
                ? 'Meeting'
                : `Group Meeting (${event.participants!.length}/${
                      event.maxParticipants
                  })`;

        const isOwner = event.owner === user.username;
        const editable = isOwner && event.participants!.length < event.maxParticipants;

        return {
            event_id: event.id,
            title,
            start: new Date(event.bookedStartTime || event.startTime),
            end: new Date(event.endTime),
            isOwner,
            editable,
            deletable: false,
            draggable: false,
            event,
        };
    }

    // This user's created availabilities
    if (event.owner === user.username) {
        if (!filters.availabilities) {
            return null;
        }

        const title =
            event.maxParticipants === 1 ? 'Available - 1 on 1' : 'Available - Group';
        return {
            event_id: event.id,
            title: title,
            start: new Date(event.startTime),
            end: new Date(event.endTime),
            draggable: true,
            isOwner: true,
            editable: true,
            deletable: true,
            event,
        };
    }

    // Other users' bookable availabilities
    if (!user.isAdmin && event.status !== AvailabilityStatus.Scheduled) {
        return null;
    }

    if (!user.isAdmin && event.cohorts.every((c) => c !== user.dojoCohort)) {
        return null;
    }

    if (!filters.allTypes && event.types.every((t) => !filters.types[t])) {
        return null;
    }

    if (!filters.allCohorts && !filters.cohorts[event.ownerCohort]) {
        return null;
    }

    return {
        event_id: event.id,
        title:
            event.maxParticipants > 1
                ? `Bookable - Group (${event.participants!.length}/${
                      event.maxParticipants
                  })`
                : `Bookable - ${event.ownerDisplayName}`,
        start: new Date(event.startTime),
        end: new Date(event.endTime),
        color: '#d32f2f',
        editable: false,
        deletable: false,
        draggable: false,
        isOwner: false,
        event,
    };
}

function processDojoEvent(
    user: User,
    filters: Filters,
    event: Event
): ProcessedEvent | null {
    if (!filters.dojoEvents) {
        return null;
    }

    if (
        !user.isAdmin &&
        !user.isCalendarAdmin &&
        event.cohorts &&
        event.cohorts.length > 0 &&
        event.cohorts.every((c) => c !== user.dojoCohort)
    ) {
        return null;
    }

    return {
        event_id: event.id,
        title: event.title,
        start: new Date(event.startTime),
        end: new Date(event.endTime),
        color: '#66bb6a',
        editable: user.isAdmin || user.isCalendarAdmin,
        deletable: user.isAdmin || user.isCalendarAdmin,
        draggable: user.isAdmin || user.isCalendarAdmin,
        isOwner: false,
        event,
    };
}

function processLigaTournament(
    user: User,
    filters: Filters,
    event: Event
): ProcessedEvent | null {
    if (!filters.dojoEvents) {
        return null;
    }
    if (!event.ligaTournament) {
        return null;
    }
    if (!filters.tournamentTypes[event.ligaTournament.timeControlType]) {
        return null;
    }

    return {
        event_id: event.id,
        title: event.title,
        start: new Date(event.startTime),
        end: new Date(event.endTime),
        color: '#66bb6a',
        editable: user.isAdmin || user.isCalendarAdmin,
        deletable: user.isAdmin || user.isCalendarAdmin,
        draggable: user.isAdmin || user.isCalendarAdmin,
        isOwner: false,
        event,
    };
}

function getProcessedEvents(
    user: User,
    filters: Filters,
    events: Event[]
): ProcessedEvent[] {
    const result: ProcessedEvent[] = [];

    for (const event of events) {
        let processedEvent: ProcessedEvent | null = null;

        if (event.type === EventType.Availability) {
            processedEvent = processAvailability(user, filters, event);
        } else if (event.type === EventType.Dojo) {
            processedEvent = processDojoEvent(user, filters, event);
        } else if (event.type === EventType.LigaTournament) {
            processedEvent = processLigaTournament(user, filters, event);
        }

        if (processedEvent !== null) {
            result.push(processedEvent);
        }
    }

    return result;
}

export default function CalendarPage() {
    const user = useAuth().user!;
    const api = useApi();

    const { events, putEvent, removeEvent, request } = useEvents();

    const filters = useFilters();

    const calendarRef = useRef<SchedulerRef>(null);
    const view = calendarRef.current?.scheduler.view;

    const [shiftHeld, setShiftHeld] = useState(false);
    const copyRequest = useRequest();

    const deleteRequest = useRequest();

    const downHandler = useCallback(
        ({ key }: { key: string }) => {
            if (key === 'Shift') {
                setShiftHeld(true);
            }
        },
        [setShiftHeld]
    );

    const upHandler = useCallback(
        ({ key }: { key: string }) => {
            if (key === 'Shift') {
                setShiftHeld(false);
            }
        },
        [setShiftHeld]
    );

    useEffect(() => {
        window.addEventListener('keydown', downHandler);
        window.addEventListener('keyup', upHandler);
        return () => {
            window.removeEventListener('keydown', downHandler);
            window.removeEventListener('keyup', upHandler);
        };
    }, [downHandler, upHandler]);

    const deleteAvailability = useCallback(
        async (id: string) => {
            try {
                console.log('Deleting availability with id: ', id);
                // Don't use deleteRequest.onStart as it messes up the
                // scheduler library
                await api.deleteEvent(id);
                console.log(`Event ${id} deleted`);

                removeEvent(id);
                deleteRequest.onSuccess('Availability deleted');
                return id;
            } catch (err) {
                console.error(err);
                deleteRequest.onFailure(err);
            }
        },
        [api, removeEvent, deleteRequest]
    );

    const copyAvailability = useCallback(
        async (
            startDate: Date,
            newEvent: ProcessedEvent,
            originalEvent: ProcessedEvent
        ) => {
            try {
                let startIso = newEvent.start.toISOString();
                let endIso = newEvent.end.toISOString();

                if (view === 'month') {
                    // In month view, we force the time when dragging to be the same as the
                    // original event because the user can't drag to individual time slots
                    const originalStartIso = originalEvent.start.toISOString();
                    const originalEndIso = originalEvent.end.toISOString();
                    startIso =
                        startIso.substring(0, startIso.indexOf('T')) +
                        originalStartIso.substring(originalStartIso.indexOf('T'));
                    endIso =
                        endIso.substring(0, endIso.indexOf('T')) +
                        originalEndIso.substring(originalEndIso.indexOf('T'));
                }

                copyRequest.onStart();

                let id = originalEvent.event?.id;
                let discordMessageId = originalEvent.event?.discordMessageId;
                let privateDiscordEventId = originalEvent.event?.privateDiscordEventId;
                let publicDiscordEventId = originalEvent.event?.publicDiscordEventId;

                // If shift is held, then set the id and discord ids to
                // undefined in order to create a new event
                if (shiftHeld) {
                    id = undefined;
                    discordMessageId = undefined;
                    privateDiscordEventId = undefined;
                    publicDiscordEventId = undefined;
                }

                const response = await api.setEvent({
                    ...(originalEvent.event ?? {}),
                    startTime: startIso,
                    endTime: endIso,
                    id,
                    discordMessageId,
                    privateDiscordEventId,
                    publicDiscordEventId,
                });
                const availability = response.data;

                putEvent(availability);
                copyRequest.onSuccess();
            } catch (err) {
                copyRequest.onFailure(err);
            }
        },
        [copyRequest, api, shiftHeld, view, putEvent]
    );

    const processedEvents = useMemo(() => {
        return getProcessedEvents(user, filters, events);
    }, [user, filters, events]);

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
        <Container sx={{ py: 3 }} maxWidth='xl'>
            <RequestSnackbar request={request} />
            <RequestSnackbar request={deleteRequest} showSuccess />
            <RequestSnackbar request={copyRequest} />

            <Grid container spacing={2}>
                <Grid item xs={12} md={2.5}>
                    <CalendarFilters filters={filters} />
                </Grid>
                <Grid item xs={12} md={9.5}>
                    <Scheduler
                        ref={calendarRef}
                        month={{
                            weekDays: [0, 1, 2, 3, 4, 5, 6],
                            weekStartOn: 0,
                            startHour: 0,
                            endHour: 23,
                            navigation: true,
                        }}
                        week={{
                            weekDays: [0, 1, 2, 3, 4, 5, 6],
                            weekStartOn: 0,
                            startHour: 0,
                            endHour: 23,
                            step: 60,
                            navigation: true,
                        }}
                        day={{
                            startHour: 0,
                            endHour: 23,
                            step: 60,
                            navigation: true,
                        }}
                        customEditor={(scheduler) => (
                            <AvailabilityEditor scheduler={scheduler} />
                        )}
                        onDelete={deleteAvailability}
                        onEventDrop={copyAvailability}
                        viewerExtraComponent={(fields, event) => (
                            <ProcessedEventViewer processedEvent={event} />
                        )}
                        events={processedEvents}
                        timeZone={
                            filters.timezone === DefaultTimezone
                                ? undefined
                                : filters.timezone
                        }
                    />
                </Grid>
            </Grid>

            <CalendarTutorial />

            <Outlet />
        </Container>
    );
}
