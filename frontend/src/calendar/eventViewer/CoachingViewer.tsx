import { ProcessedEvent } from '@aldabil/react-scheduler/types';
import { Stack, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';

import { Event } from '../../database/event';
import OwnerField from './OwnerField';
import Field from './Field';
import { dojoCohorts } from '../../database/user';
import { displayPrice } from '../../courses/list/CourseListItem';
import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { EventType, trackEvent } from '../../analytics/events';

interface CoachingViewerProps {
    processedEvent: ProcessedEvent;
}

const CoachingViewer: React.FC<CoachingViewerProps> = ({ processedEvent }) => {
    const api = useApi();
    const request = useRequest();

    const event: Event = processedEvent.event;
    const isOwner: boolean = processedEvent.isOwner;

    if (!event.coaching) {
        return null;
    }

    const onBook = () => {
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

    const fullPrice = event.coaching.fullPrice;
    const currentPrice = event.coaching.currentPrice;
    const percentOff = Math.round(((fullPrice - currentPrice) / fullPrice) * 100);

    return (
        <Stack data-cy='coaching-viewer' sx={{ pt: 2 }} spacing={2}>
            <RequestSnackbar request={request} />

            <Typography>{event.title}</Typography>

            <OwnerField title='Coach' event={event} />

            <Field title='Description' body={event.description} />

            <Field
                title='Number of Participants'
                body={`${Object.values(event.participants).length} / ${
                    event.maxParticipants
                }`}
            />

            <Field
                title='Cohorts'
                body={
                    dojoCohorts.length === event.cohorts.length ||
                    event.cohorts.length === 0
                        ? 'All Cohorts'
                        : event.cohorts.join(', ')
                }
            />

            <Stack>
                <Typography variant='subtitle2' color='text.secondary'>
                    Price
                </Typography>
                <Stack direction='row' spacing={1} alignItems='baseline'>
                    <Typography
                        variant='body1'
                        sx={{
                            color: percentOff > 0 ? 'error.main' : undefined,
                            textDecoration: percentOff > 0 ? 'line-through' : undefined,
                        }}
                    >
                        ${displayPrice(fullPrice / 100)}
                    </Typography>

                    {percentOff > 0 && (
                        <>
                            <Typography variant='body1' color='success.main'>
                                ${displayPrice(currentPrice / 100)}
                            </Typography>

                            <Typography variant='body2' color='text.secondary'>
                                (-{percentOff}%)
                            </Typography>
                        </>
                    )}
                </Stack>
            </Stack>

            {!isOwner && (
                <Stack spacing={2} pb={1}>
                    <LoadingButton
                        data-cy='book-button'
                        variant='contained'
                        loading={request.isLoading()}
                        onClick={onBook}
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
