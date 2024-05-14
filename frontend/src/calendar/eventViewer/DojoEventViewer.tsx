import { ProcessedEvent } from '@aldabil/react-scheduler/types';
import { Stack, Typography } from '@mui/material';
import Icon from '../../style/Icon';
import { Event } from '../../database/event';

interface DojoEventViewerProps {
    processedEvent: ProcessedEvent;
}

const DojoEventViewer: React.FC<DojoEventViewerProps> = ({ processedEvent }) => {
    const event: Event = processedEvent.event;

    return (
        <Stack sx={{ pt: 2 }} spacing={2}>
            <Stack>
                <Typography variant='subtitle2' color='text.secondary'>
                <Icon name='location' color='primary' sx={{marginRight: "0.3rem", verticalAlign: "middle"}}/> 
                    Location
                </Typography>
                <Typography variant='body1'>{event.location}</Typography>
            </Stack>

            {event.description && (
                <Stack>
                    <Typography variant='subtitle2' color='text.secondary'>
                    <Icon name='notes' color='primary' sx={{marginRight: "0.3rem", verticalAlign: "middle"}}/>    
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
