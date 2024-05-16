import { ProcessedEvent } from '@aldabil/react-scheduler/types';
import { LoadingButton } from '@mui/lab';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { EventType, trackEvent } from '../../analytics/events';
import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { useAuth } from '../../auth/Auth';
import { Event, EventStatus } from '../../database/event';
import { dojoCohorts } from '../../database/user';
import Icon from '../../style/Icon';
import Field from './Field';
import OwnerField from './OwnerField';
import ParticipantsList from './ParticipantsList';
import PriceField from './PriceField';

interface CoachingViewerProps {
    processedEvent: ProcessedEvent;
}

const CoachingViewer: React.FC<CoachingViewerProps> = ({ processedEvent }) => {
    const api = useApi();
    const request = useRequest();
    const user = useAuth().user;
    const navigate = useNavigate();

    const event: Event = processedEvent.event;
    if (!event.coaching) {
        return null;
    }

    const onBook = () => {
        if (!user) {
            navigate('/signup');
        }

        request.onStart();
        api.bookEvent(event.id)
            .then((resp) => {
                console.log('bookEvent response: ', resp);
                trackEvent(EventType.BookCoaching, {
                    event_id: event.id,
                    coach_id: event.owner,
                    coach_name: event.ownerDisplayName,
                });
                window.location.href = resp.data.checkoutUrl;
            })
            .catch((err) => {
                console.error('bookEvent: ', err);
                request.onFailure(err);
            });
    };

    const isOwner: boolean = processedEvent.isOwner;
    const isParticipant = Boolean(event.participants[user?.username || '']);

    return (
        <Stack data-cy='coaching-viewer' sx={{ pt: 2 }} spacing={2}>
            <RequestSnackbar request={request} />
            {event.status === EventStatus.Canceled && (isOwner || isParticipant) && (
                <Alert severity='warning' variant='filled'>
                    {isOwner
                        ? 'You have canceled this event.'
                        : 'This event has been canceled by the coach. If you already paid, you will receive a full refund.'}
                </Alert>
            )}

            <Typography>{event.title}</Typography>

            <OwnerField title='Coach' event={event} />

            <Field title='Description' body={event.description} iconName='notes' />

            <Field
                title='Cohorts'
                iconName='cohort'
                body={
                    dojoCohorts.length === event.cohorts.length ||
                    event.cohorts.length === 0
                        ? 'All Cohorts'
                        : event.cohorts.join(', ')
                }
            />

            <PriceField event={event} />

            <Stack spacing={0.5}>
                <Field
                    iconName='participant'
                    showEmptyBody
                    title={`Participants (${Object.values(event.participants).length} / ${
                        event.maxParticipants
                    })`}
                    body={
                        Object.values(event.participants).length === 0
                            ? 'No Participants Yet'
                            : event.coaching.hideParticipants &&
                                !isParticipant &&
                                !isOwner
                              ? 'Participants hidden until after booking'
                              : undefined
                    }
                />
                {(!event.coaching.hideParticipants || isParticipant || isOwner) && (
                    <ParticipantsList hideOwner event={event} />
                )}
            </Stack>

            {isOwner || isParticipant ? (
                <Button
                    variant='contained'
                    onClick={() => navigate(`/meeting/${event.id}`)}
                    color='success'
                    startIcon={<Icon name='eye' color='inherit' />}
                >
                    View Details
                </Button>
            ) : (
                <Stack spacing={2} pb={1}>
                    <LoadingButton
                        data-cy='book-button'
                        variant='contained'
                        loading={request.isLoading()}
                        onClick={onBook}
                        color='success'
                        startIcon={<Icon name='join' color='inherit' />}
                    >
                        Book
                    </LoadingButton>
                    <Typography
                        variant='caption'
                        color='text.secondary'
                        textAlign='center'
                    >
                        Upon booking, you will have 30 minutes to complete payment before
                        losing your spot. Cancelations must be made more than 24 hours in
                        advance to receive a refund.
                    </Typography>
                </Stack>
            )}
        </Stack>
    );
};

export default CoachingViewer;
