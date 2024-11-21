'use client';

import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { useEvents } from '@/api/cache/Cache';
import { useAuth, useFreeTier } from '@/auth/Auth';
import CalendarTutorial from '@/calendar/CalendarTutorial';
import { getTimeZonedDate } from '@/calendar/displayDate';
import EventEditor from '@/calendar/eventEditor/EventEditor';
import {
    CalendarFilters,
    Filters,
    getHours,
    useFilters,
} from '@/calendar/filters/CalendarFilters';
import { DefaultTimezone } from '@/calendar/filters/TimezoneSelector';
import ProcessedEventViewer from '@/components/calendar/eventViewer/ProcessedEventViewer';
import {
    AvailabilityType,
    CalendarSessionType,
    Event,
    EventStatus,
    EventType,
    TimeControlType,
} from '@/database/event';
import { ALL_COHORTS, SubscriptionStatus, TimeFormat, User } from '@/database/user';
import Icon, { icons } from '@/style/Icon';
import UpsellAlert from '@/upsell/UpsellAlert';
import UpsellDialog, { RestrictedAction } from '@/upsell/UpsellDialog';
import { Scheduler } from '@aldabil/react-scheduler';
import type { EventRendererProps, SchedulerRef } from '@aldabil/react-scheduler/types';
import { ProcessedEvent } from '@aldabil/react-scheduler/types';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Button, Container, Grid2, Snackbar, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RRule } from 'rrule';

function processAvailability(
    user: User | undefined,
    filters: Filters,
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
        if (
            filters.sessions[0] !== CalendarSessionType.AllSessions &&
            !filters.sessions.includes(CalendarSessionType.Meetings)
        ) {
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
        if (
            filters.sessions[0] !== CalendarSessionType.AllSessions &&
            !filters.sessions.includes(CalendarSessionType.Availabilities)
        ) {
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
    filters: Filters,
    event: Event,
): ProcessedEvent | null {
    if (
        filters.sessions[0] !== CalendarSessionType.AllSessions &&
        !filters.sessions.includes(CalendarSessionType.DojoEvents)
    ) {
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

    const location = event.location.toLowerCase();
    let color = 'dojoOrange.main';
    if (location.includes('twitch')) {
        color = 'twitch.main';
    } else if (location.includes('youtube')) {
        color = 'youtube.main';
    }

    return {
        event_id: event.id,
        title: event.title,
        start: new Date(event.startTime),
        end: new Date(event.endTime),
        color,
        editable: user?.isAdmin || user?.isCalendarAdmin,
        deletable: user?.isAdmin || user?.isCalendarAdmin,
        draggable: user?.isAdmin || user?.isCalendarAdmin,
        isOwner: false,
        event,
        recurring: event.rrule ? RRule.fromString(event.rrule) : undefined,
    };
}

function processLigaTournament(
    user: User | undefined,
    filters: Filters,
    event: Event,
): ProcessedEvent | null {
    if (!event.ligaTournament) {
        return null;
    }

    if (
        filters &&
        filters.tournamentTimeControls[0] !== TimeControlType.AllTimeContols &&
        !filters.tournamentTimeControls.includes(event.ligaTournament.timeControlType)
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
    filters: Filters,
    event: Event,
): ProcessedEvent | null {
    if (
        filters.sessions[0] !== CalendarSessionType.AllSessions &&
        !filters.sessions.includes(CalendarSessionType.CoachingSessions)
    ) {
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
    filters: Filters,
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
    const { user } = useAuth();
    const api = useApi();
    const isFreeTier = useFreeTier();
    const [canceled, setCanceled] = useState(false);

    const { events, putEvent, removeEvent, request } = useEvents();

    const filters = useFilters();

    const calendarRef = useRef<SchedulerRef>(null);
    const view = calendarRef.current?.scheduler.view;

    const copyRequest = useRequest();
    const deleteRequest = useRequest<string>();

    const [showFilters, setShowFilters] = useState(true);

    const toggleFilters = () => {
        setShowFilters(!showFilters);
    };

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

                const dojoEvent = originalEvent.event as Event | undefined;

                let id = dojoEvent?.id;
                let discordMessageId = dojoEvent?.discordMessageId;
                let privateDiscordEventId = dojoEvent?.privateDiscordEventId;
                let publicDiscordEventId = dojoEvent?.publicDiscordEventId;

                // If shift is held, then set the id and discord ids to
                // undefined in order to create a new event
                if (event.shiftKey) {
                    id = undefined;
                    discordMessageId = undefined;
                    privateDiscordEventId = undefined;
                    publicDiscordEventId = undefined;
                }

                let rrule = '';
                if (dojoEvent?.rrule) {
                    const options = RRule.parseString(dojoEvent.rrule);
                    options.dtstart = new Date(startIso);
                    rrule = RRule.optionsToString(options);
                }

                const response = await api.setEvent({
                    ...dojoEvent,
                    startTime: startIso,
                    endTime: endIso,
                    id,
                    discordMessageId,
                    privateDiscordEventId,
                    publicDiscordEventId,
                    rrule,
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
        calendarRef.current?.scheduler.handleState(
            (props: EventRendererProps) =>
                CustomEventRenderer({
                    ...props,
                    timeFormat: filters.timeFormat,
                }),
            'eventRenderer',
        );
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
        <Container sx={{ py: 3 }} maxWidth={false}>
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

            <Grid2 container spacing={2}>
                <Grid2 size={{ xs: 12, md: 2.5, xl: 2 }}>
                    <Button
                        onClick={toggleFilters}
                        startIcon={showFilters ? <VisibilityOff /> : <Visibility />}
                        sx={{ display: { xs: 'none', md: 'inline-flex' } }}
                    >
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </Button>
                    {showFilters && <CalendarFilters filters={filters} />}
                </Grid2>
                <Grid2
                    size={{
                        xs: 12,
                        md: showFilters ? 9.5 : 12,
                        xl: showFilters ? 10 : 12,
                    }}
                >
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
                                        onClose={() => scheduler.close()}
                                        currentAction={RestrictedAction.AddCalendarEvents}
                                    />
                                ) : (
                                    <EventEditor scheduler={scheduler} />
                                )
                            }
                            onDelete={deleteAvailability}
                            onEventDrop={copyAvailability}
                            viewerExtraComponent={(_, event) => (
                                <ProcessedEventViewer processedEvent={event} />
                            )}
                            events={processedEvents}
                            timeZone={
                                filters.timezone === DefaultTimezone
                                    ? undefined
                                    : filters.timezone
                            }
                            hourFormat={filters.timeFormat || TimeFormat.TwelveHour}
                            eventRenderer={(props) =>
                                CustomEventRenderer({
                                    ...props,
                                    timeFormat: filters.timeFormat,
                                })
                            }
                        />
                    </Stack>
                </Grid2>
            </Grid2>

            <CalendarTutorial />
        </Container>
    );
}

interface CustomEventRendererProps extends EventRendererProps {
    timeFormat: TimeFormat | undefined;
}

/**
 * Returns the location icon for the given event.
 * @param dojoEvent The event to get the location icon for.
 * @returns The location icon name or undefined if the event is undefined.
 */
function getLocationIcon(dojoEvent: Event | undefined): keyof typeof icons | undefined {
    if (!dojoEvent) {
        return undefined;
    }

    if (dojoEvent.ligaTournament?.timeControlType) {
        return dojoEvent.ligaTournament.timeControlType;
    }

    if (dojoEvent.type !== EventType.Dojo) {
        return dojoEvent.type;
    }

    const location = dojoEvent.location;
    if (!location) {
        return dojoEvent.type;
    }

    if (location.toLowerCase().includes('discord')) {
        return 'discord';
    } else if (location.toLowerCase().includes('twitch')) {
        return 'twitch';
    } else if (location.toLowerCase().includes('youtube')) {
        return 'youtube';
    }

    return dojoEvent.type;
}

export function CustomEventRenderer({
    event,
    timeFormat,
    ...props
}: CustomEventRendererProps) {
    const textColor = event.color?.endsWith('.main')
        ? event.color.replace('.main', '.contrastText')
        : 'common.black';

    let start = eventDateStr(event.start, timeFormat);
    const end = eventDateStr(event.end, timeFormat);

    if (
        (start.endsWith('AM') && end.endsWith('AM')) ||
        (start.endsWith('PM') && end.endsWith('PM'))
    ) {
        start = start.replace(' AM', '').replace(' PM', '');
    }

    const quarterHours = Math.abs(event.start.getTime() - event.end.getTime()) / 900000;
    const maxLines = 2 + Math.max(0, quarterHours - 4);
    const dojoEvent = event.event as Event | undefined;

    return (
        <Stack
            sx={{
                height: '100%',
                backgroundColor: event.color,
                color: textColor,
                fontSize: '0.775em',
                pl: 0.25,
                pt: 0.25,
            }}
            {...props}
        >
            <Stack direction='row' alignItems='start' spacing={0.5}>
                <Icon
                    name={getLocationIcon(dojoEvent)}
                    color='inherit'
                    fontSize='inherit'
                    sx={{
                        // Makes the icon 0 width if the container is less than 80px wide
                        '--container-min-width': '80px',
                        maxWidth: 'calc((100% - var(--container-min-width)) * 9999)',
                    }}
                />

                <Stack>
                    <Typography
                        fontSize='inherit'
                        color='inherit'
                        sx={{
                            WebkitLineClamp: maxLines,
                            display: '-webkit-box',
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineClamp: maxLines,
                            fontWeight: 'bold',
                            lineHeight: 1.3,
                        }}
                    >
                        {event.title}
                    </Typography>
                    <Typography fontSize='inherit' color='inherit'>
                        {start} – {end}
                    </Typography>
                </Stack>
            </Stack>
        </Stack>
    );
}

function eventDateStr(date: Date, timeFormat: TimeFormat | undefined): string {
    return date
        .toLocaleTimeString(undefined, {
            hour12: timeFormat === TimeFormat.TwelveHour,
            hour: 'numeric',
            minute: 'numeric',
        })
        .replace(':00', '');
}
