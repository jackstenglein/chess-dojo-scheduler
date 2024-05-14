import { ProcessedEvent } from '@aldabil/react-scheduler/types';
import { Button, Stack } from '@mui/material';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import { AvailabilityType, Event, getDisplayString } from '../../database/event';
import { dojoCohorts } from '../../database/user';
import Icon from '../../style/Icon';
import Field from './Field';
import OwnerField from './OwnerField';
interface AvailabilityViewerProps {
    processedEvent: ProcessedEvent;
}

const AvailabilityViewer: React.FC<AvailabilityViewerProps> = ({ processedEvent }) => {
    const event: Event = processedEvent.event;
    const navigate = useNavigate();

    const isOwner: boolean = processedEvent.isOwner;

    const startBooking = () => {
        navigate(`/calendar/availability/${event.id}`);
    };

    return (
        <Stack data-cy='availability-viewer' sx={{ pt: 2 }} spacing={2}>
            {!isOwner && <OwnerField title='Owner' event={event} />}

            {event.maxParticipants > 1 && (
                <Field
                    IconName='participant'
                    title='Number of Participants'
                    body={`${Object.values(event.participants).length} / ${
                        event.maxParticipants
                    }`}
                />
            )}

            <Field
                IconName='meet'
                title='Available Types'
                body={event.types
                    ?.map((t: AvailabilityType) => getDisplayString(t))
                    .join(', ')}
            />

            {event.description.length > 0 && (
                <Field title='Description' body={event.description} IconName='notes' />
            )}

            <Field
                IconName='cohort'
                title='Cohorts'
                body={
                    dojoCohorts.length === event.cohorts.length
                        ? 'All Cohorts'
                        : event.cohorts.join(', ')
                }
            />

            {!isOwner && (
                <Button
                    data-cy='book-button'
                    variant='contained'
                    color='success'
                    onClick={startBooking}
                    startIcon={<Icon name='join' />}
                >
                    Book
                </Button>
            )}
        </Stack>
    );
};

export default AvailabilityViewer;
