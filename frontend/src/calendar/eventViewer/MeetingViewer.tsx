import { Stack, Button, Typography } from '@mui/material';
import { ProcessedEvent } from '@aldabil/react-scheduler/types';
import { useNavigate } from 'react-router-dom';

import { Event, getDisplayString } from '../../database/event';
import Field from './Field';
import ParticipantsList from './ParticipantsList';
import Icon from '../../style/Icon';
const maxDisplayParticipants = 4;

interface MeetingViewerProps {
    processedEvent: ProcessedEvent;
}

const MeetingViewer: React.FC<MeetingViewerProps> = ({ processedEvent }) => {
    const navigate = useNavigate();
    const event: Event = processedEvent.event;

    const participantsLength = Object.values(event.participants).length;

    return (
        <Stack sx={{ pt: 2 }} spacing={2}>
            <Field title='Description' body={event.description} IconName='notes'/>
            <Field title='Location' body={event.location || 'Discord'} IconName='location' />

            {event.bookedType ? (
                <Field title='Meeting Type' body={getDisplayString(event.bookedType)} IconName='meet'/>
            ) : (
                <Field
                    title='Meeting Types'
                    IconName='meet'
                    body={event.types?.map((t) => getDisplayString(t)).join(', ') || ''}
                />
            )}

            <Stack spacing={0.5}>
                <Typography variant='h6' color='text.secondary'>
                <Icon name='participant' color='primary' sx={{marginRight: "0.5rem", verticalAlign: "middle"}}/>   
                    Particpants
                </Typography>
                <ParticipantsList event={event} maxItems={maxDisplayParticipants} />
                {participantsLength > maxDisplayParticipants - 1 && (
                    <Typography>
                        ... and {participantsLength - (maxDisplayParticipants - 1)} more
                    </Typography>
                )}
            </Stack>

            <Button variant='contained' onClick={() => navigate(`/meeting/${event.id}`)}>
                View Details
            </Button>
        </Stack>
    );
};

export default MeetingViewer;
