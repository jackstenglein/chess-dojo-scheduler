import React from 'react';
import { Stack, Typography, Button } from '@mui/material';
import { ProcessedEvent } from '@aldabil/react-scheduler/types';

import {
    Availability,
    AvailabilityType,
    getDisplayString,
} from '../database/availability';
import { Link, useNavigate } from 'react-router-dom';
import GraduationIcon from '../scoreboard/GraduationIcon';

interface AvailabilityViewerProps {
    event: ProcessedEvent;
}

const AvailabilityViewer: React.FC<AvailabilityViewerProps> = ({ event }) => {
    const availability: Availability = event.availability;
    const navigate = useNavigate();

    const isOwner = event.isOwner;

    const startBooking = () => {
        navigate(`/calendar/availability/${availability.id}`);
    };

    return (
        <Stack sx={{ pt: 2 }} spacing={2}>
            {!isOwner && (
                <Stack>
                    <Typography variant='subtitle2' color='text.secondary'>
                        Owner
                    </Typography>
                    <Stack direction='row' spacing={2} alignItems='center'>
                        <Link to={`/profile/${availability.owner}`}>
                            <Typography variant='body1'>
                                {availability.ownerDiscord} ({availability.ownerCohort})
                            </Typography>
                        </Link>
                        <GraduationIcon
                            cohort={availability.ownerPreviousCohort}
                            size={25}
                        />
                    </Stack>
                </Stack>
            )}

            {availability.maxParticipants > 1 && (
                <Stack>
                    <Typography variant='subtitle2' color='text.secondary'>
                        Number of Participants
                    </Typography>
                    <Typography variant='body1'>
                        {availability.participants?.length ?? 0} /{' '}
                        {availability.maxParticipants}
                    </Typography>
                </Stack>
            )}

            <Stack>
                <Typography variant='subtitle2' color='text.secondary'>
                    Available Types
                </Typography>
                <Typography variant='body1'>
                    {availability.types
                        .map((t: AvailabilityType) => getDisplayString(t))
                        .join(', ')}
                </Typography>
            </Stack>

            {availability.description.length > 0 && (
                <Stack>
                    <Typography variant='subtitle2' color='text.secondary'>
                        Description
                    </Typography>
                    <Typography variant='body1'>{availability.description}</Typography>
                </Stack>
            )}

            <Stack>
                <Typography variant='subtitle2' color='text.secondary'>
                    Cohorts
                </Typography>
                <Typography variant='body1'>{availability.cohorts.join(', ')}</Typography>
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
