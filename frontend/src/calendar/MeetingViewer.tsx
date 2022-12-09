import { Stack, Button, Typography } from '@mui/material';
import { ProcessedEvent } from '@aldabil/react-scheduler/types';

import { useNavigate } from 'react-router-dom';

interface MeetingViewerProps {
    event: ProcessedEvent;
}

const MeetingViewer: React.FC<MeetingViewerProps> = ({ event }) => {
    const navigate = useNavigate();

    return (
        <Stack sx={{ pt: 2 }} spacing={2}>
            <Stack>
                <Typography variant='subtitle2' color='text.secondary'>
                    Location
                </Typography>
                <Typography variant='body1'>
                    {event.meeting.location || 'Discord'}
                </Typography>
            </Stack>

            {event.meeting.description && (
                <Stack>
                    <Typography variant='subtitle2' color='text.secondary'>
                        Description
                    </Typography>
                    <Typography variant='body1' style={{ whiteSpace: 'pre-line' }}>
                        {event.meeting.description}
                    </Typography>
                </Stack>
            )}

            <Button
                variant='contained'
                onClick={() => navigate(`/meeting/${event.meeting.id}`)}
            >
                View Details
            </Button>
        </Stack>
    );
};

export default MeetingViewer;
