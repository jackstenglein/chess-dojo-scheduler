import { useMemo, useRef } from 'react';
import { Button, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Scheduler } from '@aldabil/react-scheduler';
// import { ProcessedEvent } from '@aldabil/react-scheduler/dist/types';

import { useApi } from '../api/Api';
import AvailabilityEditor from './AvailabilityEditor';
import { Availability } from '../database/availability';
import { RequestSnackbar, useRequest } from '../api/Request';
import { useAuth } from '../auth/Auth';

export default function CalendarPage() {
    const user = useAuth().user;
    const api = useApi();
    const navigate = useNavigate();

    const availabilities = useRef<Record<string, Availability>>({});
    const fetchRequest = useRequest();
    const deleteRequest = useRequest();

    // const fetchAvailabilities = async (query: string) => {
    //     const startToken = '?start=';
    //     const endToken = '&end=';
    //     const endIndex = query.indexOf(endToken);
    //     const startStr = query.substring(startToken.length, endIndex);
    //     const endStr = query.substring(endIndex + endToken.length);

    //     const startIso = new Date(startStr).toISOString();
    //     const endIso = new Date(endStr).toISOString();

    //     fetchRequest.onStart();

    //     return api
    //         .getAvailabilities({ startDate: startIso, endDate: endIso })
    //         .then((avails) => {
    //             const newAvailabilities = Object.assign(
    //                 {},
    //                 ...avails.map((a) => ({ [a.id]: a }))
    //             );
    //             availabilities.current = Object.assign(availabilities, newAvailabilities);
    //             fetchRequest.onSuccess();
    //             return avails.map(
    //                 (a) =>
    //                     ({
    //                         event_id: a.id,
    //                         title: 'Available',
    //                         start: new Date(a.startTime),
    //                         end: new Date(a.endTime),
    //                         availability: a,
    //                     } as ProcessedEvent)
    //             );
    //         })
    //         .catch((err) => {
    //             console.error(err);
    //             fetchRequest.onFailure(err);
    //         });
    // };

    const onConfirm = (availability: Availability) => {
        availabilities.current[availability.id] = availability;
    };

    const deleteAvailability = async (id: string) => {
        const availability = availabilities.current[id];
        if (!availability) {
            return;
        }

        try {
            deleteRequest.onStart();
            const response = await api.deleteAvailability(availability);
            delete availabilities.current[response.data.id];
            deleteRequest.onSuccess('Availability deleted');
            return response.data.id;
        } catch (err) {
            console.error(err);
            deleteRequest.onFailure(err);
        }
    };

    return (
        <Container sx={{ py: 3 }}>
            <RequestSnackbar request={fetchRequest} />
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
                // remoteEvents={fetchAvailabilities}
                onDelete={deleteAvailability}
                events={Object.values(availabilities).map((a) => ({
                    event_id: a.id,
                    title: 'Available',
                    start: new Date(a.startTime),
                    end: new Date(a.endTime),
                    availability: a,
                }))}
            />
        </Container>
    );
}
