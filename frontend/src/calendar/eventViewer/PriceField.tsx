import { Stack, Typography } from '@mui/material';

import { useAuth } from '../../auth/Auth';
import { displayPrice } from '../../courses/list/CourseListItem';
import { Event } from '../../database/event';

const PriceField: React.FC<{ event: Event }> = ({ event }) => {
    const user = useAuth().user;

    if (!event.coaching) {
        return null;
    }

    const isParticipant = Boolean(event.participants[user?.username || '']);
    const fullPrice = event.coaching.fullPrice;
    const currentPrice = event.coaching.currentPrice;
    const percentOff =
        currentPrice > 0 ? Math.round(((fullPrice - currentPrice) / fullPrice) * 100) : 0;

    return (
        <Stack>
            <Typography variant='subtitle2' color='text.secondary'>
                Price
            </Typography>
            {isParticipant ? (
                <Typography>Already Booked</Typography>
            ) : (
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
            )}
        </Stack>
    );
};

export default PriceField;
