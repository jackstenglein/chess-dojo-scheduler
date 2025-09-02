import { Event } from '@/database/event';
import { ProcessedEvent } from '@jackstenglein/react-scheduler/types';
import { Stack } from '@mui/material';
import Field from './Field';

interface DojoEventViewerProps {
    processedEvent: ProcessedEvent;
}

const DojoEventViewer: React.FC<DojoEventViewerProps> = ({ processedEvent }) => {
    const event = processedEvent.event as Event;

    return (
        <Stack sx={{ pt: 2 }} spacing={2}>
            <Field title='Location' body={event.location} iconName='location' />
            <Field title='Description' body={event.description} iconName='notes' />
        </Stack>
    );
};

export default DojoEventViewer;
