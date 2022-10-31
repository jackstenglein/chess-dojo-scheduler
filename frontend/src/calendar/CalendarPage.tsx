import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Scheduler } from '@aldabil/react-scheduler';
import { ProcessedEvent } from '@aldabil/react-scheduler/types';

import { useApi } from '../api/Api';
import AvailabilityEditor from './AvailabilityEditor';
import { Availability } from '../database/availability';
import { RequestSnackbar, RequestStatus, useRequest } from '../api/Request';
import { useAuth } from '../auth/Auth';

export default function CalendarPage() {
    const user = useAuth().user;
    const api = useApi();
    const navigate = useNavigate();

    // const availabilities = useRef<Record<string, Availability>>({});
    const deleteRequest = useRequest();

    const ownedAvailabilities = useRef<Record<string, Availability>>({});
    const ownedAvailabilitiesRequest = useRequest<Availability[]>();

    const otherAvailabilities = useRef<Availability[]>([]);
    const otherAvailabilitiesRequest = useRequest();

    useEffect(() => {
        if (ownedAvailabilitiesRequest.status === RequestStatus.NotSent) {
            ownedAvailabilitiesRequest.onStart();
            api.getAvailabilities()
                .then((availabilities) => {
                    ownedAvailabilitiesRequest.onSuccess(availabilities);
                    const newAvailabilities = Object.assign(
                        {},
                        ...availabilities.map((a) => ({ [a.id]: a }))
                    );
                    Object.assign(ownedAvailabilities.current, newAvailabilities);
                })
                .catch((err) => {
                    console.error(err);
                    ownedAvailabilitiesRequest.onFailure(err);
                });
        }
    }, [ownedAvailabilitiesRequest, api]);

    const fetchAvailabilities = async (query: string) => {
        const startToken = '?start=';
        const endToken = '&end=';
        const endIndex = query.indexOf(endToken);
        const startStr = query.substring(startToken.length, endIndex);
        const endStr = query.substring(endIndex + endToken.length);

        const startIso = new Date(startStr).toISOString();
        const endIso = new Date(endStr).toISOString();

        otherAvailabilitiesRequest.onStart();

        return api
            .getAvailabilitiesByTime(startIso, endIso)
            .then((avails) => {
                otherAvailabilitiesRequest.onSuccess();
                Object.assign(otherAvailabilities.current, avails);
                return avails.map(
                    (a) =>
                        ({
                            event_id: a.id,
                            title: 'Available',
                            start: new Date(a.startTime),
                            end: new Date(a.endTime),
                            availability: a,
                            color: 'red',
                            editable: false,
                            deletable: false,
                            draggable: false,
                        } as ProcessedEvent)
                );
            })
            .catch((err) => {
                console.error(err);
                otherAvailabilitiesRequest.onFailure(err);
            });
    };

    const onConfirm = (availability: Availability) => {
        ownedAvailabilities.current[availability.id] = availability;
    };

    const deleteAvailability = async (id: string) => {
        const availability = ownedAvailabilities.current[id];
        if (!availability) {
            return;
        }

        try {
            deleteRequest.onStart();
            await api.deleteAvailability(availability);
            delete ownedAvailabilities.current[id];
            deleteRequest.onSuccess('Availability deleted');
            return id;
        } catch (err) {
            console.error(err);
            deleteRequest.onFailure(err);
        }
    };

    const ownedAvailabilityEvents: ProcessedEvent[] = Object.values(
        ownedAvailabilities.current
    ).map((a) => ({
        event_id: a.id,
        title: 'Available',
        start: new Date(a.startTime),
        end: new Date(a.endTime),
        availability: a,
        draggable: false,
    }));

    const otherAvailabilityEvents: ProcessedEvent[] =
        otherAvailabilities.current.map((a) => ({
            event_id: a.id,
            title: 'Availability',
            start: new Date(a.startTime),
            end: new Date(a.endTime),
            availability: a,
            color: 'red',
            editable: false,
            deletable: false,
            draggable: false,
        })) ?? [];

    const events: ProcessedEvent[] = ownedAvailabilityEvents.concat(
        otherAvailabilityEvents
    );

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
                remoteEvents={fetchAvailabilities}
                onDelete={deleteAvailability}
                events={events}
            />
        </Container>
    );
}
