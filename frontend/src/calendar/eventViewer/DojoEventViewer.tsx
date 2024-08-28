import { ProcessedEvent } from '@aldabil/react-scheduler/types';
import { Stack, Typography } from '@mui/material';
import { Event } from '../../database/event';
import Icon from '../../style/Icon';
import { getLocationIcon } from '../CalendarPage';

interface DojoEventViewerProps {
    processedEvent: ProcessedEvent;
}

const DojoEventViewer: React.FC<DojoEventViewerProps> = ({ processedEvent }) => {
    const event = processedEvent.event as Event;

    return (
        <Stack sx={{ pt: 2 }} spacing={2}>
            <Stack>
                <Typography variant='subtitle2' color='text.secondary'>
                    <Icon
                        name={getLocationIcon(event.location)}
                        color='primary'
                        sx={{ marginRight: '0.3rem', verticalAlign: 'middle' }}
                    />
                    Location
                </Typography>
                <Typography variant='body1'>{event.location}</Typography>
            </Stack>

            {event.description && (
                <Stack>
                    <Typography variant='subtitle2' color='text.secondary'>
                        <Icon
                            name='notes'
                            color='primary'
                            sx={{ marginRight: '0.3rem', verticalAlign: 'middle' }}
                        />
                        Description
                    </Typography>
                    <Typography variant='body1' style={{ whiteSpace: 'pre-line' }}>
                        {event.description}
                    </Typography>
                </Stack>
            )}
        </Stack>
    );
};

export default DojoEventViewer;
