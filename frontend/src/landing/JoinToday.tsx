import { Stack, Typography } from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import { useLocation, useNavigate } from 'react-router-dom';
import PriceMatrix from '../upsell/PriceMatrix';

const JoinToday = () => {
    const navigate = useNavigate();
    const locationState = useLocation().state;

    return (
        <Stack width={1} alignItems='center' mt={5} textAlign='center'>
            <Typography variant='h2' mb={3}>
                Join the{' '}
                <Typography variant='h2' color='dojoOrange.main' component='span'>
                    ChessDojo
                </Typography>{' '}
                training program today
            </Typography>

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
