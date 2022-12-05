import React, { useState } from 'react';
import { Stack, Typography, Button } from '@mui/material';
import { ProcessedEvent } from '@aldabil/react-scheduler/types';

import {
    Availability,
    AvailabilityType,
    getDisplayString,
} from '../database/availability';
import AvailabilityBooker from './AvailabilityBooker';

interface AvailabilityViewerProps {
    event: ProcessedEvent;
}

const AvailabilityViewer: React.FC<AvailabilityViewerProps> = ({ event }) => {
    const availability: Availability = event.availability;

    const [isBooking, setIsBooking] = useState(false);

    if (event.isOwner) {
        return null!;
    }

    const startBooking = () => {
        setIsBooking(true);
    };

    const stopBooking = () => {
        setIsBooking(false);
    };

    return (
        <>
            <Stack sx={{ pt: 2 }} spacing={2}>
                <Stack>
                    <Typography variant='subtitle2' color='text.secondary'>
                        Owner
                    </Typography>
                    <Typography variant='body1'>
                        {availability.ownerDiscord} ({availability.ownerCohort})
                    </Typography>
                </Stack>

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

                <Button variant='contained' onClick={startBooking}>
                    Book
                </Button>
            </Stack>

            <AvailabilityBooker
                availability={availability}
                open={isBooking}
                onClose={stopBooking}
            />
        </>
    );
};

export default AvailabilityViewer;
