import { Event, getDisplayString } from '@/database/event';
import Icon from '@/style/Icon';
import { ProcessedEvent } from '@aldabil/react-scheduler/types';
import { Button, Stack, Typography } from '@mui/material';
import RouterLink from 'next/link';
import Field from './Field';
import ParticipantsList from './ParticipantsList';

const maxDisplayParticipants = 4;

interface MeetingViewerProps {
    processedEvent: ProcessedEvent;
}

const MeetingViewer: React.FC<MeetingViewerProps> = ({ processedEvent }) => {
    const event = processedEvent.event as Event;

    const participantsLength = Object.values(event.participants).length;

    return (
        <Stack sx={{ pt: 2 }} spacing={2}>
            <Field title='Description' body={event.description} iconName='notes' />
            <Field
                title='Location'
                body={event.location || 'Discord'}
                iconName='location'
            />

            {event.bookedType ? (
                <Field
                    title='Meeting Type'
                    body={getDisplayString(event.bookedType)}
                    iconName='meet'
                />
            ) : (
                <Field
                    title='Meeting Types'
                    iconName='meet'
                    body={event.types?.map((t) => getDisplayString(t)).join(', ') || ''}
                />
            )}

            <Stack spacing={0.5}>
                <Typography variant='h6' color='text.secondary'>
                    <Icon
                        name='participant'
                        color='primary'
                        sx={{ marginRight: '0.5rem', verticalAlign: 'middle' }}
                    />
                    Particpants
                </Typography>
                <ParticipantsList event={event} maxItems={maxDisplayParticipants} />
                {participantsLength > maxDisplayParticipants - 1 && (
                    <Typography>
                        ... and {participantsLength - (maxDisplayParticipants - 1)} more
                    </Typography>
                )}
            </Stack>

            <Button
                component={RouterLink}
                variant='contained'
                href={`/meeting/${event.id}`}
                startIcon={<Icon name='eye' />}
            >
                View Details
            </Button>
        </Stack>
    );
};

export default MeetingViewer;
