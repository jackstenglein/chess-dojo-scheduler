import { Stack, Typography } from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import { useLocation, useNavigate } from 'react-router-dom';
import PriceMatrix from '../upsell/PriceMatrix';

const today = new Date();
const promoEnd = new Date('2024-06-01');
const showPromo = today.getTime() < promoEnd.getTime();

const JoinToday = () => {
    const navigate = useNavigate();
    const locationState = useLocation().state;

    return (
        <Stack width={1} alignItems='center' mt={5} textAlign='center'>
            <Typography variant='h2' mb={showPromo ? 1 : 3}>
                Join the{' '}
                <Typography variant='h2' color='dojoOrange.main' component='span'>
                    ChessDojo
                </Typography>{' '}
                training program today
            </Typography>

            {showPromo && (
                <Typography variant='h5' mb={3}>
                    Use code DOJO30 at checkout for 30% off your first month!
                </Typography>
            )}

            <Grid2 container spacing={3} width={1}>
                <PriceMatrix
                    onSubscribe={() => navigate('/signup', { state: locationState })}
                    onFreeTier={() => navigate('/signup', { state: locationState })}
                />
            </Grid2>
        </Stack>
    );
};

export default JoinToday;
