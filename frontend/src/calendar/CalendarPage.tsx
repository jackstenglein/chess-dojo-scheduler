import { Scheduler } from '@aldabil/react-scheduler';
import type { SchedulerRef } from '@aldabil/react-scheduler/types';
import { ProcessedEvent } from '@aldabil/react-scheduler/types';
import { Box, Container, Grid, Snackbar, Stack } from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { useEvents } from '../api/cache/Cache';
import { useAuth, useFreeTier } from '../auth/Auth';
import { AvailabilityType, Event, EventStatus, EventType } from '../database/event';
import { ALL_COHORTS, SubscriptionStatus, TimeFormat, User } from '../database/user';
import Icon from '../style/Icon';
import UpsellAlert from '../upsell/UpsellAlert';
import UpsellDialog, { RestrictedAction } from '../upsell/UpsellDialog';
import CalendarTutorial from './CalendarTutorial';
import { getTimeZonedDate } from './displayDate';
import EventEditor from './eventEditor/EventEditor';
import ProcessedEventViewer from './eventViewer/ProcessedEventViewer';
import {
    CalendarFilters,
    DefaultTimezone,
    Filters,
    getHours,
    useFilters,
} from './filters/CalendarFilters';
function processAvailability(
    user: User | undefined,
    filters: Filters | undefined,
    event: Event,
): ProcessedEvent | null {
    if (event.status === EventStatus.Canceled) {
        return null;
    }

    // This user's joined meetings
    if (
        user &&
        (event.owner === user.username || event.participants[user.username]) &&
        Object.values(event.participants).length > 0
    ) {
        if (filters && !filters.meetings) {
            return null;
        }

        const title =
            event.maxParticipants === 1
                ? 'Meeting'
                : `Group Meeting (${Object.values(event.participants).length}/${
                      event.maxParticipants
                  })`;

        const isOwner = event.owner === user.username;
        const editable =
            isOwner && Object.values(event.participants).length < event.maxParticipants;

        return {
            event_id: event.id,
            title,
            start: new Date(event.bookedStartTime || event.startTime),
            end: new Date(event.endTime),
            color: 'meet.main',
            isOwner,
            editable,
            deletable: false,
            draggable: false,
            event,
        };
    }

    // This user's created availabilities
    if (event.owner === user?.username) {
        if (filters && !filters.availabilities) {
            return null;
        }

        const title =
            event.maxParticipants === 1 ? 'Available - 1 on 1' : 'Available - Group';
        return {
            event_id: event.id,
            title: title,
            start: new Date(event.startTime),
            end: new Date(event.endTime),
            color: 'info.main',
            draggable: true,
            isOwner: true,
            editable: true,
            deletable: true,
            event,
        };
    }

    // Other users' bookable availabilities
    if (!user?.isAdmin && event.status !== EventStatus.Scheduled) {
        return null;
    }

    if (user && !user.isAdmin && event.cohorts.every((c) => c !== user.dojoCohort)) {
        return null;
    }

    if (
        filters &&
        filters.types[0] !== AvailabilityType.AllTypes &&
        event.types?.every((t) => !filters.types.includes(t))
    ) {
        return null;
    }

    if (
        filters &&
        filters.cohorts[0] !== ALL_COHORTS &&
        !filters.cohorts.includes(event.ownerCohort)
    ) {
        return null;
    }

    return {
        event_id: event.id,
        title:
            event.maxParticipants > 1
                ? `Bookable - Group (${Object.values(event.participants).length}/${
                      event.maxParticipants
                  })`
                : `Bookable - ${event.ownerDisplayName}`,
        start: new Date(event.startTime),
        end: new Date(event.endTime),
        color: 'book.main',
        editable: false,
        deletable: false,
        draggable: false,
        isOwner: false,
        event,
    };
}

function processDojoEvent(
    user: User | undefined,
    filters: Filters | undefined,
    event: Event,
): ProcessedEvent | null {
    if (filters && !filters.dojoEvents) {
        return null;
    }

    if (
        user &&
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
        color: 'dojoOrange.main',
        editable: user?.isAdmin || user?.isCalendarAdmin,
        deletable: user?.isAdmin || user?.isCalendarAdmin,
        draggable: user?.isAdmin || user?.isCalendarAdmin,
        isOwner: false,
        event,
    };
}

function processLigaTournament(
    user: User | undefined,
    filters: Filters | undefined,
    event: Event,
): ProcessedEvent | null {
    if (filters && !filters.dojoEvents) {
        return null;
    }
    if (!event.ligaTournament) {
        return null;
    }
    if (
        filters &&
        !filters.tournamentTimeControls[event.ligaTournament.timeControlType]
    ) {
        return null;
    }

    return {
        event_id: event.id,
        title: event.title,
        start: new Date(event.startTime),
        end: new Date(event.endTime),
        color: 'liga.main',
        editable: user?.isAdmin || user?.isCalendarAdmin,
        deletable: user?.isAdmin || user?.isCalendarAdmin,
        draggable: user?.isAdmin || user?.isCalendarAdmin,
        isOwner: false,
        event,
    };
}

export function processCoachingEvent(
    user: User | undefined,
    filters: Filters | undefined,
    event: Event,
): ProcessedEvent | null {
    if (filters && !filters.coaching) {
        return null;
    }

    const isOwner = event.owner === user?.username;
    if (
        user &&
        !isOwner &&
        !user.isAdmin &&
        !user.isCalendarAdmin &&
        event.cohorts &&
        event.cohorts.length > 0 &&
        event.cohorts.every((c) => c !== user.dojoCohort)
    ) {
        return null;
    }

    const isFreeTier = !user || user.subscriptionStatus === SubscriptionStatus.FreeTier;
    if (!isOwner && isFreeTier && !event.coaching?.bookableByFreeUsers) {
        return null;
    }

    const isParticipant = user && Boolean(event.participants[user.username]);
    if (event.status !== EventStatus.Scheduled && !isOwner && !isParticipant) {
        return null;
    }

    return {
        event_id: event.id,
        title: event.title,
        start: new Date(event.startTime),
        end: new Date(event.endTime),
        color: 'coaching.main',
        editable: isOwner,
        deletable: isOwner && Object.values(event.participants).length === 0,
        draggable: isOwner,
        isOwner,
        event,
    };
}

export function getProcessedEvents(
    user: User | undefined,
    filters: Filters | undefined,
    events: Event[],
): ProcessedEvent[] {
    const result: ProcessedEvent[] = [];

    for (const event of events) {
        let processedEvent: ProcessedEvent | null = null;

        const startHour = getTimeZonedDate(
            new Date(event.startTime),
            filters?.timezone,
        ).getHours();
        if (
            startHour < (filters?.minHour?.hour || 0) ||
            startHour > (filters?.maxHour?.hour || 24)
        ) {
            continue;
        }

        if (event.type === EventType.Availability) {
            processedEvent = processAvailability(user, filters, event);
        } else if (event.type === EventType.Dojo) {
            processedEvent = processDojoEvent(user, filters, event);
        } else if (event.type === EventType.LigaTournament) {
            processedEvent = processLigaTournament(user, filters, event);
        } else if (event.type === EventType.Coaching) {
            processedEvent = processCoachingEvent(user, filters, event);
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
    const isFreeTier = useFreeTier();
    const [canceled, setCanceled] = useState(
        Boolean(useLocation().state?.canceled) || false,
    );

    const { events, putEvent, removeEvent, request } = useEvents();

    const filters = useFilters();

    const calendarRef = useRef<SchedulerRef>(null);
    const view = calendarRef.current?.scheduler.view;

    const copyRequest = useRequest();
    const deleteRequest = useRequest();

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
        [api, removeEvent, deleteRequest],
    );

    const copyAvailability = useCallback(
        async (
            event: React.DragEvent<HTMLButtonElement>,
            _droppedOn: Date,
            newEvent: ProcessedEvent,
            originalEvent: ProcessedEvent,
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
                if (event.shiftKey) {
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
        [copyRequest, api, view, putEvent],
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

    useEffect(() => {
        calendarRef.current?.scheduler.handleState(filters.timeFormat, 'hourFormat');
    }, [calendarRef, filters.timeFormat]);

    const weekStartOn = filters.weekStartOn;
    const [minHour, maxHour] = getHours(filters.minHour, filters.maxHour);

    useEffect(() => {
        calendarRef.current?.scheduler.handleState(
            {
                weekDays: [0, 1, 2, 3, 4, 5, 6],
                weekStartOn: weekStartOn,
                startHour: minHour,
                endHour: maxHour,
                navigation: true,
            },
            'month',
        );
        calendarRef.current?.scheduler.handleState(
            {
                weekDays: [0, 1, 2, 3, 4, 5, 6],
                weekStartOn: weekStartOn,
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
    }, [calendarRef, weekStartOn, minHour, maxHour]);

    return (
        <Container sx={{ py: 3 }} maxWidth='xl'>
            <RequestSnackbar request={request} />
            <RequestSnackbar request={deleteRequest} showSuccess />
            <RequestSnackbar request={copyRequest} />
            <Snackbar
                open={canceled}
                autoHideDuration={6000}
                onClose={() => setCanceled(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                message='Meeting canceled'
            />

            <Grid container spacing={2}>
                <Grid item xs={12} md={2.5}>
                    <CalendarFilters filters={filters} />
                </Grid>
                <Grid item xs={12} md={9.5}>
                    <Stack spacing={3}>
                        {isFreeTier && (
                            <UpsellAlert>
                                Free-tier users can book events but cannot post their own
                                events. Upgrade your account to add new events to the
                                calendar.
                            </UpsellAlert>
                        )}

                        <Scheduler
                            ref={calendarRef}
                            agenda={false}
                            month={{
                                weekDays: [0, 1, 2, 3, 4, 5, 6],
                                weekStartOn: weekStartOn,
                                startHour: minHour,
                                endHour: maxHour,
                                navigation: true,
                            }}
                            week={{
                                weekDays: [0, 1, 2, 3, 4, 5, 6],
                                weekStartOn: weekStartOn,
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
                            customEditor={(scheduler) =>
                                isFreeTier ? (
                                    <UpsellDialog
                                        open={true}
                                        onClose={scheduler.close}
                                        currentAction={RestrictedAction.AddCalendarEvents}
                                    />
                                ) : (
                                    <EventEditor scheduler={scheduler} />
                                )
                            }
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
                                                {event.event?.type !==
                                                EventType.LigaTournament ? (
                                                    <>
                                                        <Icon
                                                            name={event.event?.type}
                                                            sx={{
                                                                marginRight: '0.5rem',
                                                                verticalAlign: 'middle',
                                                            }}
                                                            fontSize='small'
                                                            color='cblack'
                                                        />
                                                        {event.title} <br />{' '}
                                                        {event.start.toLocaleTimeString(
                                                            'en-US',
                                                            {
                                                                timeStyle: 'short',
                                                            },
                                                        )}{' '}
                                                        -{' '}
                                                        {event.end.toLocaleTimeString(
                                                            'en-US',
                                                            { timeStyle: 'short' },
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Icon
                                                            name={
                                                                event.event
                                                                    ?.ligaTournament
                                                                    ?.timeControlType
                                                            }
                                                            sx={{
                                                                marginRight: '0.5rem',
                                                                verticalAlign: 'middle',
                                                            }}
                                                            color='cblack'
                                                            fontSize='small'
                                                        />
                                                        {event.title} <br />{' '}
                                                        {event.start.toLocaleTimeString(
                                                            'en-US',
                                                            {
                                                                timeStyle: 'short',
                                                            },
                                                        )}{' '}
                                                        -{' '}
                                                        {event.end.toLocaleTimeString(
                                                            'en-US',
                                                            { timeStyle: 'short' },
                                                        )}
                                                    </>
                                                )}
                                            </>
                                        </Box>
                                    </Box>
                                );
                            }}
                        />
                    </Stack>
                </Grid>
            </Grid>

            <CalendarTutorial />

            <Outlet />
        </Container>
    );
}
