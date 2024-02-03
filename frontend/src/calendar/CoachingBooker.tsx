import { useNavigate } from 'react-router-dom';
import {
    AppBar,
    Button,
    Dialog,
    DialogContent,
    Stack,
    Toolbar,
    Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

import { Event } from '../database/event';
import { Transition } from './AvailabilityBooker';
import { RequestSnackbar, RequestStatus, useRequest } from '../api/Request';
import OwnerField from './eventViewer/OwnerField';
import Field from './eventViewer/Field';
import { TimeFormat, dojoCohorts } from '../database/user';
import { useAuth } from '../auth/Auth';
import { displayPrice } from '../courses/list/CourseListItem';
import { useApi } from '../api/Api';
import { EventType, trackEvent } from '../analytics/events';
import { toDojoDateString, toDojoTimeString } from './displayDate';

interface CoachingBookerProps {
    event: Event;
}

const CoachingBooker: React.FC<CoachingBookerProps> = ({ event }) => {
    const user = useAuth().user;
    const navigate = useNavigate();
    const request = useRequest();
    const api = useApi();

    if (!event.coaching) {
        return null;
    }

    const isParticipant = Boolean(event.participants[user?.username || '']);
    const fullPrice = event.coaching.fullPrice;
    const currentPrice = event.coaching.currentPrice;
    const percentOff =
        currentPrice > 0 ? Math.round(((fullPrice - currentPrice) / fullPrice) * 100) : 0;

    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);

    const timezone = user?.timezoneOverride;
    const timeFormat = user?.timeFormat || TimeFormat.TwelveHour;
    const startDate = toDojoDateString(startTime, timezone);
    const startTimeStr = toDojoTimeString(startTime, timezone, timeFormat);
    const endTimeStr = toDojoTimeString(endTime, timezone, timeFormat);

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

    return (
        <Dialog
            data-cy='availability-booker'
            fullScreen
            open={true}
            TransitionComponent={Transition}
        >
            <AppBar sx={{ position: 'relative' }}>
                <Toolbar>
                    <Typography sx={{ ml: 2, flex: 1 }} variant='h6' component='div'>
                        Book Coaching Session
                    </Typography>
                    <Button
                        data-cy='cancel-button'
                        color='inherit'
                        onClick={() => navigate('/calendar')}
                        disabled={request.status === RequestStatus.Loading}
                    >
                        Cancel
                    </Button>
                    <LoadingButton
                        data-cy='book-button'
                        color='inherit'
                        disabled={isParticipant}
                        loading={request.status === RequestStatus.Loading}
                        onClick={onBook}
                    >
                        Book
                    </LoadingButton>
                </Toolbar>
            </AppBar>
            <DialogContent>
                <Stack sx={{ pt: 2 }} spacing={3}>
                    <Typography variant='h6'>{event.title}</Typography>

                    <Field
                        title='Time'
                        body={`${startDate} ${startTimeStr} - ${endTimeStr}`}
                    />

                    <Stack>
                        <Typography variant='subtitle2' color='text.secondary'>
                            Price
                        </Typography>
                        {isParticipant ? (
                            <Typography>Already Booked</Typography>
                        ) : (
                            <>
                                <Stack direction='row' spacing={1} alignItems='baseline'>
                                    <Typography
                                        variant='body1'
                                        sx={{
                                            color:
                                                percentOff > 0 ? 'error.main' : undefined,
                                            textDecoration:
                                                percentOff > 0
                                                    ? 'line-through'
                                                    : undefined,
                                        }}
                                    >
                                        ${displayPrice(fullPrice / 100)}
                                    </Typography>

                                    {percentOff > 0 && (
                                        <>
                                            <Typography
                                                variant='body1'
                                                color='success.main'
                                            >
                                                ${displayPrice(currentPrice / 100)}
                                            </Typography>

                                            <Typography
                                                variant='body2'
                                                color='text.secondary'
                                            >
                                                (-{percentOff}%)
                                            </Typography>
                                        </>
                                    )}
                                </Stack>

                                <Typography variant='caption' color='text.secondary'>
                                    Upon booking, you will have 30 minutes to complete
                                    payment before losing your spot. Cancelations must be
                                    made more than 24 hours in advance to receive a
                                    refund.
                                </Typography>
                            </>
                        )}
                    </Stack>

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
                </Stack>

                <RequestSnackbar request={request} />
            </DialogContent>
        </Dialog>
    );
};

export default CoachingBooker;
