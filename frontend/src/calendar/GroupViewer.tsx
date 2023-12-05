import { Stack, Button, Typography } from '@mui/material';
import { ProcessedEvent } from '@aldabil/react-scheduler/types';

import { useNavigate } from 'react-router-dom';
import { Event, AvailabilityType, getDisplayString } from '../database/event';

interface GroupViewerProps {
    processedEvent: ProcessedEvent;
}

const GroupViewer: React.FC<GroupViewerProps> = ({ processedEvent }) => {
    const navigate = useNavigate();

    const event: Event = processedEvent.event;

    return (
        <Stack sx={{ pt: 2 }} spacing={2}>
            <Stack>
                <Typography variant='subtitle2' color='text.secondary'>
                    Number of Participants
                </Typography>
                <Typography variant='body1'>
                    {Object.values(event.participants).length} / {event.maxParticipants}
                </Typography>
            </Stack>

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

            {event.description && (
                <Stack>
                    <Typography variant='subtitle2' color='text.secondary'>
                        Description
                    </Typography>
                    <Typography variant='body1' style={{ whiteSpace: 'pre-line' }}>
                        {event.description}
                    </Typography>
                </Stack>
            )}

            <Stack>
                <Typography variant='subtitle2' color='text.secondary'>
                    Cohorts
                </Typography>
                <Typography variant='body1'>{event.cohorts.join(', ')}</Typography>
            </Stack>

            <Button variant='contained' onClick={() => navigate(`/group/${event.id}`)}>
                View Details
            </Button>
        </Stack>
    );
};

export default GroupViewer;
