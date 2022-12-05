import { Stack, Button } from '@mui/material';
import { ProcessedEvent } from '@aldabil/react-scheduler/types';

import { useNavigate } from 'react-router-dom';

interface MeetingViewerProps {
    event: ProcessedEvent;
}

const MeetingViewer: React.FC<MeetingViewerProps> = ({ event }) => {
    const navigate = useNavigate();

    let path = '';
    if (event.meeting) {
        path = `/meeting/${event.meeting.id}`;
    } else if (event.group) {
        path = `/group/${event.group.id}`;
    }

    return (
        <Stack sx={{ pt: 2 }}>
            <Button variant='contained' onClick={() => navigate(path)}>
                View Details
            </Button>
        </Stack>
    );
};

export default MeetingViewer;
