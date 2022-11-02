import { Stack, Button } from '@mui/material';
import { ProcessedEvent } from '@aldabil/react-scheduler/types';

import { useNavigate } from 'react-router-dom';

interface MeetingViewerProps {
    event: ProcessedEvent;
}

const MeetingViewer: React.FC<MeetingViewerProps> = ({ event }) => {
    const navigate = useNavigate();

    return (
        <Stack sx={{ pt: 2 }}>
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
