import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { Container, Grid } from '@mui/material';
import { Scheduler } from '@aldabil/react-scheduler';
import type { SchedulerRef } from '@aldabil/react-scheduler/types';
import { ProcessedEvent } from '@aldabil/react-scheduler/types';

import { useApi } from '../api/Api';
import AvailabilityEditor from './AvailabilityEditor';
import {
    Availability,
    AvailabilityStatus,
    getDisplayString,
} from '../database/availability';
import { RequestSnackbar, useRequest } from '../api/Request';
import { Meeting, MeetingStatus } from '../database/meeting';
import { CalendarFilters, DefaultTimezone, Filters, useFilters } from './CalendarFilters';
import ProcessedEventViewer from './ProcessedEventViewer';
import { useCalendar } from '../api/cache/Cache';
import { useAuth } from '../auth/Auth';
import { User } from '../database/user';
import { Outlet } from 'react-router-dom';

const ONE_HOUR = 3600000;

function getEventFromAvailability(
    user: User,
    filters: Filters,
    a: Availability
): ProcessedEvent | null {
    // This user's availabilities
    if (a.owner === user.username) {
        if (a.participants && a.participants.length > 0) {
            if (filters.meetings) {
                return {
                    event_id: a.id,
                    title: `Group Meeting (${a.participants.length}/${a.maxParticipants})`,
                    start: new Date(a.startTime),
                    end: new Date(a.endTime),
                    group: a,
                    draggable: false,
                    isOwner: true,
                    editable: a.participants.length < a.maxParticipants,
                };
            }
            return null;
        }

        if (!filters.availabilities) {
            return null;
        }

        if (a.status !== AvailabilityStatus.Scheduled) {
            return null;
        }

        let title = 'Available - 1 on 1';
        if (a.maxParticipants > 1) {
            title = 'Available - Group';
        }

        return {
            event_id: a.id,
            title: title,
            start: new Date(a.startTime),
            end: new Date(a.endTime),
            availability: a,
            draggable: true,
            isOwner: true,
        };
    }

    // This users joined groups
    if (a.participants?.some((p) => p.username === user.username)) {
        if (!filters.meetings) {
            return null;
        }
        return {
            event_id: a.id,
            title: `Group Meeting (${a.participants.length}/${a.maxParticipants})`,
            start: new Date(a.startTime),
            end: new Date(a.endTime),
            group: a,
            editable: false,
            deletable: false,
            draggable: false,
            isOwner: false,
        };
    }

    // Other users' bookable availabilities

    if (!user.isAdmin && a.status !== AvailabilityStatus.Scheduled) {
        return null;
    }

    if (!filters.allTypes && a.types.every((t) => !filters.types[t])) {
        return null;
    }

    if (!filters.allCohorts && !filters.cohorts[a.ownerCohort]) {
        return null;
    }

    return {
        event_id: a.id,
        title:
            a.maxParticipants > 1
                ? `Bookable - Group (${a.participants.length}/${a.maxParticipants})`
                : `Bookable - ${a.ownerDisplayName}`,
        start: new Date(a.startTime),
        end: new Date(a.endTime),
        availability: a,
        color: '#d32f2f',
        editable: false,
        deletable: false,
        draggable: false,
        isOwner: false,
    };
}

function getEventFromMeeting(
    user: User,
    filters: Filters,
    m: Meeting
): ProcessedEvent | null {
    if (m.status === MeetingStatus.Canceled) {
        return null;
    }
    let color = undefined;
    if (m.owner !== user.username && m.participant !== user.username) {
        color = '#66bb6a';
    }

    return {
        event_id: m.id,
        title: getDisplayString(m.type),
        start: new Date(m.startTime),
        end: new Date(new Date(m.startTime).getTime() + ONE_HOUR),
        meeting: m,
        editable: false,
        deletable: false,
        draggable: false,
        color: color,
    };
}

function getEvents(
    user: User,
    filters: Filters,
    meetings: Meeting[],
    availabilities: Availability[]
): ProcessedEvent[] {
    const events: ProcessedEvent[] = [];

    availabilities.forEach((a) => {
        const event = getEventFromAvailability(user, filters, a);
        if (event !== null) {
            events.push(event);
        }
    });

    if (filters.meetings) {
        meetings.forEach((m) => {
            const event = getEventFromMeeting(user, filters, m);
            if (event !== null) {
                events.push(event);
            }
        });
    }

    return events;
}

export default function CalendarPage() {
    const user = useAuth().user!;
    const api = useApi();

    const { meetings, availabilities, putAvailability, removeAvailability, request } =
        useCalendar();
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
                await api.deleteAvailability(id);
                console.log(`Availability ${id} deleted`);

                removeAvailability(id);
                deleteRequest.onSuccess('Availability deleted');
                return id;
            } catch (err) {
                console.error(err);
                deleteRequest.onFailure(err);
            }
        },
        [api, removeAvailability, deleteRequest]
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

                // If shift is held, then set the id and discordMessagedId to
                // undefinded in order to create a new availability
                const id = shiftHeld ? undefined : originalEvent.availability?.id;
                const discordMessageId = shiftHeld
                    ? undefined
                    : originalEvent.availability?.discordMessageId;
                const response = await api.setAvailability({
                    ...(originalEvent.availability ?? {}),
                    startTime: startIso,
                    endTime: endIso,
                    id,
                    discordMessageId,
                });
                const availability = response.data;

                putAvailability(availability);
                copyRequest.onSuccess();
            } catch (err) {
                copyRequest.onFailure(err);
            }
        },
        [copyRequest, api, shiftHeld, view, putAvailability]
    );

    const events = useMemo(() => {
        console.log('Getting events');
        return getEvents(user, filters, meetings, availabilities);
    }, [user, filters, meetings, availabilities]);

    useEffect(() => {
        calendarRef.current?.scheduler.handleState(events, 'events');
    }, [events, calendarRef]);

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
                            <ProcessedEventViewer event={event} />
                        )}
                        events={events}
                        timeZone={
                            filters.timezone === DefaultTimezone
                                ? undefined
                                : filters.timezone
                        }
                    />
                </Grid>
            </Grid>

            <Outlet />
        </Container>
    );
}
