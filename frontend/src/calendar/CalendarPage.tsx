import { useCallback, useState, useEffect } from 'react';
import { Container, Grid } from '@mui/material';
import { Scheduler } from '@aldabil/react-scheduler';
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
import { CalendarFilters, Filters, useFilters } from './CalendarFilters';
import ProcessedEventViewer from './ProcessedEventViewer';
import { useCache, useCalendar } from '../api/cache/Cache';
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
                : `Bookable - ${a.ownerDiscord}`,
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
    const cache = useCache();

    const { meetings, availabilities, request } = useCalendar();
    const filters = useFilters();

    const [shiftHeld, setShiftHeld] = useState(false);
    const copyAvailabilityRequest = useRequest();

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

                cache.availabilities.remove(id);
                deleteRequest.onSuccess('Availability deleted');
                return id;
            } catch (err) {
                console.error(err);
                deleteRequest.onFailure(err);
            }
        },
        [api, cache, deleteRequest]
    );

    const copyAvailability = useCallback(
        async (
            startDate: Date,
            newEvent: ProcessedEvent,
            originalEvent: ProcessedEvent
        ) => {
            try {
                const startIso = newEvent.start.toISOString();
                const endIso = newEvent.end.toISOString();

                copyAvailabilityRequest.onStart();

                // If shift is held, then set the id to undefinded in order to
                // create a new availability
                const id = shiftHeld ? undefined : originalEvent.availability?.id;
                const response = await api.setAvailability({
                    ...(originalEvent.availability ?? {}),
                    startTime: startIso,
                    endTime: endIso,
                    id,
                });
                console.log('Got setAvailability response: ', response);
                const availability = response.data;

                cache.availabilities.put(availability);
                copyAvailabilityRequest.onSuccess();
            } catch (err) {
                copyAvailabilityRequest.onFailure(err);
            }
        },
        [copyAvailabilityRequest, api, cache, shiftHeld]
    );

    const events = getEvents(user, filters, meetings, availabilities);

    return (
        <Container sx={{ py: 3 }} maxWidth='xl'>
            <RequestSnackbar request={request} />
            <RequestSnackbar request={deleteRequest} showSuccess />
            <RequestSnackbar request={copyAvailabilityRequest} />

            <Grid container spacing={2}>
                <Grid item xs={2.5}>
                    <CalendarFilters filters={filters} />
                </Grid>
                <Grid item xs={9.5}>
                    <Scheduler
                        view='week'
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
                        events={events}
                        viewerExtraComponent={(fields, event) => (
                            <ProcessedEventViewer event={event} />
                        )}
                    />
                </Grid>
            </Grid>

            <Outlet />
        </Container>
    );
}
