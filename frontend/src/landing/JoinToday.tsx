import { Button, Stack, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const JoinToday = () => {
    const navigate = useNavigate();
    const locationState = useLocation().state;

    return (
        <Stack width={1} alignItems='center' mt={5} textAlign='center'>
            <Typography variant='h2'>
                Join the{' '}
                <Typography variant='h2' color='dojoOrange.main' component='span'>
                    ChessDojo
                </Typography>{' '}
                training program today
            </Typography>
            <Typography variant='h4' mb={3} textAlign='center'>
                Try it for free! No credit card required.
            </Typography>

            <Stack direction='row' spacing={3} justifyContent='center'>
                <Button
                    variant='contained'
                    onClick={() => navigate('/signup', { state: locationState })}
                    sx={{
                        fontSize: '1rem',
                        textTransform: 'none',
                        fontWeight: '600',
                        py: 1.5,
                        px: 2.5,
                    }}
                >
                    Sign Up for Free
                </Button>
                <Button
                    variant='outlined'
                    onClick={() => navigate('/signin', { state: locationState })}
                    sx={{
                        fontSize: '1rem',
                        textTransform: 'none',
                        fontWeight: '600',
                        py: 1.5,
                        px: 2.5,
                    }}
                >
                    Sign In
                </Button>
            </Stack>
        </Stack>
    );
};

export default JoinToday;
