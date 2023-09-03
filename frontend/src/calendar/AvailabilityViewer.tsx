import React from 'react';
import { Stack, Typography, Button, Link } from '@mui/material';
import { ProcessedEvent } from '@aldabil/react-scheduler/types';

import { Link as RouterLink, useNavigate } from 'react-router-dom';
import GraduationIcon from '../scoreboard/GraduationIcon';
import { Event, AvailabilityType, getDisplayString } from '../database/event';

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
        <Stack sx={{ pt: 2 }} spacing={2}>
            {!isOwner && (
                <Stack>
                    <Typography variant='subtitle2' color='text.secondary'>
                        Owner
                    </Typography>
                    <Stack direction='row' spacing={2} alignItems='center'>
                        <Link component={RouterLink} to={`/profile/${event.owner}`}>
                            <Typography variant='body1'>
                                {event.ownerDisplayName} ({event.ownerCohort})
                            </Typography>
                        </Link>
                        <GraduationIcon cohort={event.ownerPreviousCohort} size={25} />
                    </Stack>
                </Stack>
            )}

            {event.maxParticipants > 1 && (
                <Stack>
                    <Typography variant='subtitle2' color='text.secondary'>
                        Number of Participants
                    </Typography>
                    <Typography variant='body1'>
                        {event.participants!.length} / {event.maxParticipants}
                    </Typography>
                </Stack>
            )}

            <Stack>
                <Typography variant='subtitle2' color='text.secondary'>
                    Available Types
                </Typography>
                <Typography variant='body1'>
                    {event.types
                        .map((t: AvailabilityType) => getDisplayString(t))
                        .join(', ')}
                </Typography>
            </Stack>

            {event.description.length > 0 && (
                <Stack>
                    <Typography variant='subtitle2' color='text.secondary'>
                        Description
                    </Typography>
                    <Typography variant='body1'>{event.description}</Typography>
                </Stack>
            )}

            <Stack>
                <Typography variant='subtitle2' color='text.secondary'>
                    Cohorts
                </Typography>
                <Typography variant='body1'>{event.cohorts.join(', ')}</Typography>
            </Stack>

            {!isOwner && (
                <Button variant='contained' onClick={startBooking}>
                    Book
                </Button>
            )}
        </Stack>
    );
};

export default AvailabilityViewer;
