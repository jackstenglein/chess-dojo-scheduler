import { Container, Grid } from '@mui/material';
import { Scheduler } from '@aldabil/react-scheduler';
import { ProcessedEvent } from '@aldabil/react-scheduler/types';

import { useApi } from '../api/Api';
import AvailabilityEditor from './AvailabilityEditor';
import { AvailabilityStatus, getDisplayString } from '../database/availability';
import { RequestSnackbar, useRequest } from '../api/Request';
import { MeetingStatus } from '../database/meeting';
import { CalendarFilters, useFilters } from './CalendarFilters';
import ProcessedEventViewer from './ProcessedEventViewer';
import { useCache, useCalendar } from '../api/Cache';
import { useAuth } from '../auth/Auth';

const ONE_HOUR = 3600000;

export default function CalendarPage() {
    const user = useAuth().user!;
    const api = useApi();
    const cache = useCache();

    const { meetings, availabilities, request } = useCalendar();
    const filters = useFilters();

    const deleteRequest = useRequest();

    const deleteAvailability = async (id: string) => {
        try {
            console.log('Deleting availability with id: ', id);
            // Don't use deleteRequest.onStart as it messes up the
            // scheduler library
            await api.deleteAvailability(id);
            console.log(`Availability ${id} deleted`);

            cache.removeAvailability(id);
            deleteRequest.onSuccess('Availability deleted');
            return id;
        } catch (err) {
            console.error(err);
            deleteRequest.onFailure(err);
        }
    };

    const events: ProcessedEvent[] = [];

    if (filters.availabilities) {
        const ownedAvailabilityEvents: ProcessedEvent[] =
            availabilities
                .filter(
                    (a) =>
                        a.owner === user.username &&
                        a.status === AvailabilityStatus.Scheduled
                )
                .map((a) => ({
                    event_id: a.id,
                    title: 'Available',
                    start: new Date(a.startTime),
                    end: new Date(a.endTime),
                    availability: a,
                    draggable: false,
                    isOwner: true,
                })) ?? [];
        events.push(...ownedAvailabilityEvents);
    }

    if (filters.meetings) {
        const meetingEvents: ProcessedEvent[] =
            meetings
                ?.filter((m) => m.status !== MeetingStatus.Canceled)
                .map((m) => ({
                    event_id: m.id,
                    title: getDisplayString(m.type),
                    start: new Date(m.startTime),
                    end: new Date(new Date(m.startTime).getTime() + ONE_HOUR),
                    meeting: m,
                    editable: false,
                    deletable: false,
                    draggable: false,
                    color:
                        m.owner === user.username || m.participant === user.username
                            ? undefined
                            : '#66bb6a',
                })) ?? [];
        events.push(...meetingEvents);
    }

    const otherAvailabilityEvents: ProcessedEvent[] =
        availabilities
            .filter((a) => {
                if (
                    a.owner === user.username ||
                    a.status !== AvailabilityStatus.Scheduled
                ) {
                    return false;
                }
                if (!filters.allTypes && a.types.every((t) => !filters.types[t])) {
                    return false;
                }
                if (!filters.allCohorts && !filters.cohorts[a.ownerCohort]) {
                    return false;
                }
                return true;
            })
            .map((a) => ({
                event_id: a.id,
                title: `Bookable - ${a.ownerDiscord}`,
                start: new Date(a.startTime),
                end: new Date(a.endTime),
                availability: a,
                color: '#d32f2f',
                editable: false,
                deletable: false,
                draggable: false,
                isOwner: false,
            })) ?? [];

    events.push(...otherAvailabilityEvents);

    return (
        <Container sx={{ py: 3 }} maxWidth='xl'>
            <RequestSnackbar request={request} />
            <RequestSnackbar request={deleteRequest} showSuccess />

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
                        events={events}
                        viewerExtraComponent={(fields, event) => (
                            <ProcessedEventViewer event={event} />
                        )}
                    />
                </Grid>
            </Grid>
        </Container>
    );
}
