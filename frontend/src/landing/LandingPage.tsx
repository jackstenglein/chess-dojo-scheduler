import { Box, Button, Container, Stack, Typography, useTheme } from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthStatus, useAuth } from '../auth/Auth';
import LoadingPage from '../loading/LoadingPage';
import JoinToday from './JoinToday';
import Sensei from './Sensei';
import Testimonials from './Testimonials';
import WhatsIncluded from './WhatsIncluded';

const LandingPage = () => {
    const auth = useAuth();
    const navigate = useNavigate();
    const locationState = useLocation().state;
    const theme = useTheme();

    if (auth.status === AuthStatus.Loading) {
        return <LoadingPage />;
    }

    if (auth.status === AuthStatus.Authenticated) {
        return <Navigate to='/profile' replace />;
    }

    return (
        <Container data-cy='landing-page' sx={{ py: 5 }} maxWidth='xl'>
            <Box
                sx={{
                    height: { md: 'calc(100vh - var(--navbar-height) - 200px)' },
                    mb: { xs: 4, md: 0 },
                }}
            >
                <Grid2 container rowSpacing={4} columnSpacing={2}>
                    <Grid2 xs={12} md={6} justifyContent='center'>
                        <Stack
                            height={1}
                            justifyContent='center'
                            alignItems='center'
                            spacing={6}
                        >
                            <Stack alignItems='center' spacing={2}>
                                <Typography
                                    variant='h2'
                                    textAlign='center'
                                    data-cy='title'
                                >
                                    ChessDojo
                                </Typography>
                                <Typography
                                    variant='h5'
                                    textAlign='center'
                                    data-cy='subtitle'
                                >
                                    The ChessDojo{' '}
                                    <Typography
                                        variant='h5'
                                        color='dojoOrange.main'
                                        component='span'
                                    >
                                        Training Program
                                    </Typography>{' '}
                                    offers structured training plans for all levels
                                    0-2500, along with an active and supportive community
                                </Typography>
                            </Stack>

                            <Stack direction='row' spacing={3}>
                                <Button
                                    variant='contained'
                                    onClick={() =>
                                        navigate('/signup', { state: locationState })
                                    }
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
                                    onClick={() =>
                                        navigate('/signin', { state: locationState })
                                    }
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
                    </Grid2>

                    <Grid2 xs={12} md={6}>
                        <Stack height={1} justifyContent='center' alignItems='center'>
                            <iframe
                                style={{ width: '100%', aspectRatio: '1.77' }}
                                src='https://www.youtube.com/embed/7lF9Qwk9NmM?loop=1'
                                title='YouTube video player'
                                frameBorder='0'
                                allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                                referrerPolicy='strict-origin-when-cross-origin'
                                allowFullScreen
                            />
                        </Stack>
                    </Grid2>
                </Grid2>
            </Box>

            <WhatsIncluded />
            <Sensei />
            <Testimonials />
            <JoinToday />
        </Container>
    );
};

export default LandingPage;
