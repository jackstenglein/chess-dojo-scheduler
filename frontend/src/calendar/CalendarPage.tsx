import { useEffect } from 'react';
import { Container } from '@mui/material';
import { Scheduler } from '@aldabil/react-scheduler';
import { ProcessedEvent } from '@aldabil/react-scheduler/types';

import { useApi } from '../api/Api';
import AvailabilityEditor from './AvailabilityEditor';
import { Availability, getDisplayString } from '../database/availability';
import { RequestSnackbar, RequestStatus, useRequest } from '../api/Request';
import AvailabilityViewer from './AvailabilityViewer';
import { Meeting } from '../database/meeting';

const ONE_HOUR = 3600000;

export default function CalendarPage() {
    const api = useApi();

    const deleteRequest = useRequest();

    const ownedAvailabilitiesRequest = useRequest<Availability[]>();
    const otherAvailabilitiesRequest = useRequest<Availability[]>();
    const meetingsRequest = useRequest<Meeting[]>();

    useEffect(() => {
        if (!ownedAvailabilitiesRequest.isSent()) {
            ownedAvailabilitiesRequest.onStart();
            api.getAvailabilities()
                .then((availabilities) => {
                    ownedAvailabilitiesRequest.onSuccess(availabilities);
                })
                .catch((err) => {
                    console.error(err);
                    ownedAvailabilitiesRequest.onFailure(err);
                });
        }
    }, [ownedAvailabilitiesRequest, api]);

    useEffect(() => {
        if (!meetingsRequest.isSent()) {
            meetingsRequest.onStart();
            api.listMeetings()
                .then((meetings) => {
                    meetingsRequest.onSuccess(meetings);
                })
                .catch((err) => {
                    console.error(err);
                    meetingsRequest.onFailure(err);
                });
        }
    }, [meetingsRequest, api]);

    useEffect(() => {
        if (!otherAvailabilitiesRequest.isSent()) {
            otherAvailabilitiesRequest.onStart();
            const startIso = new Date().toISOString();
            api.getAvailabilitiesByTime(startIso)
                .then((availabilities) => {
                    otherAvailabilitiesRequest.onSuccess(availabilities);
                })
                .catch((err) => {
                    console.error(err);
                    otherAvailabilitiesRequest.onFailure(err);
                });
        }
    }, [otherAvailabilitiesRequest, api]);

    const onConfirm = (availability: Availability) => {
        const ownedAvailabilities = ownedAvailabilitiesRequest.data ?? [];
        const index = ownedAvailabilities.findIndex((a) => a.id === availability.id);
        if (index >= 0) {
            ownedAvailabilitiesRequest.onSuccess([
                ...ownedAvailabilities.slice(0, index),
                availability,
                ...ownedAvailabilities.slice(index + 1),
            ]);
        } else {
            ownedAvailabilitiesRequest.onSuccess(
                ownedAvailabilities.concat(availability)
            );
        }
    };

    const deleteAvailability = async (id: string) => {
        const ownedAvailabilities = ownedAvailabilitiesRequest.data ?? [];
        const availability = ownedAvailabilities.find((a) => a.id === id);
        if (!availability) {
            return;
        }

        try {
            deleteRequest.onStart();
            await api.deleteAvailability(availability);
            ownedAvailabilitiesRequest.onSuccess(
                ownedAvailabilities.filter((a) => a.id !== id)
            );
            deleteRequest.onSuccess('Availability deleted');
            return id;
        } catch (err) {
            console.error(err);
            deleteRequest.onFailure(err);
        }
    };

    const ownedAvailabilityEvents: ProcessedEvent[] =
        ownedAvailabilitiesRequest.data?.map((a) => ({
            event_id: a.id,
            title: 'Available',
            start: new Date(a.startTime),
            end: new Date(a.endTime),
            availability: a,
            draggable: false,
            isOwner: true,
        })) ?? [];

    const meetingEvents: ProcessedEvent[] =
        meetingsRequest.data?.map((m) => ({
            event_id: m.id,
            title: getDisplayString(m.type),
            start: new Date(m.startTime),
            end: new Date(new Date(m.startTime).getTime() + ONE_HOUR),
            meeting: m,
            editable: false,
            deletable: false,
            draggable: false,
        })) ?? [];

    const otherAvailabilityEvents: ProcessedEvent[] =
        otherAvailabilitiesRequest.data?.map((a) => ({
            event_id: a.id,
            title: 'Bookable',
            start: new Date(a.startTime),
            end: new Date(a.endTime),
            availability: a,
            color: 'red',
            editable: false,
            deletable: false,
            draggable: false,
            isOwner: false,
        })) ?? [];

    const events: ProcessedEvent[] = ownedAvailabilityEvents.concat(
        otherAvailabilityEvents,
        meetingEvents
    );

    console.log('Full Events: ', events);

    return (
        <Container sx={{ py: 3 }}>
            <RequestSnackbar request={otherAvailabilitiesRequest} />
            <RequestSnackbar request={deleteRequest} showSuccess />

            <Scheduler
                view='week'
                month={{
                    weekDays: [0, 1, 2, 3, 4, 5, 6],
                    weekStartOn: 0,
                    startHour: 0,
                    endHour: 23,
                }}
                week={{
                    weekDays: [0, 1, 2, 3, 4, 5, 6],
                    weekStartOn: 0,
                    startHour: 0,
                    endHour: 23,
                    step: 60,
                }}
                day={{
                    startHour: 0,
                    endHour: 23,
                    step: 60,
                }}
                customEditor={(scheduler) => (
                    <AvailabilityEditor scheduler={scheduler} onConfirm={onConfirm} />
                )}
                onDelete={deleteAvailability}
                events={events}
                viewerExtraComponent={(fields, event) => (
                    <AvailabilityViewer event={event} />
                )}
            />
        </Container>
    );
}
