import { Alert, Snackbar } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useCache } from '../api/cache/Cache';
import { EventType } from '../database/event';
import LoadingPage from '../loading/LoadingPage';
import AvailabilityBooker from './AvailabilityBooker';
import CoachingBooker from './CoachingBooker';

const EventBooker = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const cache = useCache();

    const event = cache.events.get(id || '');

    if (!event) {
        if (cache.isLoading) {
            return <LoadingPage />;
        }

        return (
            <Snackbar
                open
                autoHideDuration={6000}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    variant='filled'
                    severity='error'
                    sx={{ width: '100%' }}
                    onClose={() => navigate('/calendar')}
                >
                    This event cannot be found. It is either fully booked, deleted or not
                    available to your cohort.
                </Alert>
            </Snackbar>
        );
    }

    if (event.type === EventType.Availability) {
        return <AvailabilityBooker availability={event} />;
    } else if (event.type === EventType.Coaching) {
        return <CoachingBooker event={event} />;
    }
    return null;
};

export default EventBooker;
