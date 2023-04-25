import { Stack, Button, Typography } from '@mui/material';
import { ProcessedEvent } from '@aldabil/react-scheduler/types';

import { useNavigate } from 'react-router-dom';
import { Event } from '../database/event';

interface MeetingViewerProps {
    processedEvent: ProcessedEvent;
}

const MeetingViewer: React.FC<MeetingViewerProps> = ({ processedEvent }) => {
    const navigate = useNavigate();
    const event: Event = processedEvent.event;

    return (
        <Stack sx={{ pt: 2 }} spacing={2}>
            <Stack>
                <Typography variant='subtitle2' color='text.secondary'>
                    Location
                </Typography>
                <Typography variant='body1'>{event.location || 'Discord'}</Typography>
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

            <Button variant='contained' onClick={() => navigate(`/meeting/${event.id}`)}>
                View Details
            </Button>
        </Stack>
    );
};

export default MeetingViewer;
