import { Event } from '@/database/event';
import { ProcessedEvent } from '@jackstenglein/react-scheduler/types';
import { Button, Stack, Typography } from '@mui/material';
import Field from './Field';
import OwnerField from './OwnerField';

export function LiveClassViewer({ processedEvent }: { processedEvent: ProcessedEvent }) {
    const event = processedEvent.event as Event;

    return (
        <Stack data-cy='live-class-viewer' sx={{ pt: 2 }} spacing={2}>
            <Typography>{event.title}</Typography>

            <OwnerField title='Sensei' event={event} />
            <Field title='Location' body={event.location} iconName='location' />
            <Field title='Description' body={event.description} iconName='notes' />

            {isLink(event.location) && (
                <Button variant='contained' href={event.location} target='_blank'>
                    Join Meeting
                </Button>
            )}
        </Stack>
    );
}

function isLink(location: string): boolean {
    return location.startsWith('https://') || location.startsWith('http://');
}
