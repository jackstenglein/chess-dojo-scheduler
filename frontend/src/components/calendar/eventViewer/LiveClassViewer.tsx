import { Event } from '@/database/event';
import { ProcessedEvent } from '@jackstenglein/react-scheduler/types';
import { Stack, Typography } from '@mui/material';

export function LiveClassViewer({ processedEvent }: { processedEvent: ProcessedEvent }) {
    const event = processedEvent.event as Event;
    if (!event) {
        return null;
    }

    <Stack spacing={2}>
        <Typography>{event.title}</Typography>
    </Stack>;
}
