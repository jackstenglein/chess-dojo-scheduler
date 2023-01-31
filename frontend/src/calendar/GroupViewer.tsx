import { Stack, Button, Typography } from '@mui/material';
import { ProcessedEvent } from '@aldabil/react-scheduler/types';

import { useNavigate } from 'react-router-dom';
import {
    Availability,
    AvailabilityType,
    getDisplayString,
} from '../database/availability';

interface GroupViewerProps {
    event: ProcessedEvent;
}

const GroupViewer: React.FC<GroupViewerProps> = ({ event }) => {
    const navigate = useNavigate();

    const group: Availability = event.group;

    return (
        <Stack sx={{ pt: 2 }} spacing={2}>
            <Stack>
                <Typography variant='subtitle2' color='text.secondary'>
                    Number of Participants
                </Typography>
                <Typography variant='body1'>
                    {group.participants.length} / {group.maxParticipants}
                </Typography>
            </Stack>

            <Stack>
                <Typography variant='subtitle2' color='text.secondary'>
                    Available Types
                </Typography>
                <Typography variant='body1'>
                    {group.types
                        .map((t: AvailabilityType) => getDisplayString(t))
                        .join(', ')}
                </Typography>
            </Stack>

            {group.description && (
                <Stack>
                    <Typography variant='subtitle2' color='text.secondary'>
                        Description
                    </Typography>
                    <Typography variant='body1' style={{ whiteSpace: 'pre-line' }}>
                        {group.description}
                    </Typography>
                </Stack>
            )}

            <Stack>
                <Typography variant='subtitle2' color='text.secondary'>
                    Cohorts
                </Typography>
                <Typography variant='body1'>{group.cohorts.join(', ')}</Typography>
            </Stack>

            <Button variant='contained' onClick={() => navigate(`/group/${group.id}`)}>
                View Details
            </Button>
        </Stack>
    );
};

export default GroupViewer;
