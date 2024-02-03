import { Button, Container, Grid, Stack, Typography } from '@mui/material';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { AuthStatus, useAuth } from '../auth/Auth';
import LoadingPage from '../loading/LoadingPage';

const LandingPage = () => {
    const auth = useAuth();
    const navigate = useNavigate();
    const locationState = useLocation().state;

    if (auth.status === AuthStatus.Loading) {
        return <LoadingPage />;
    }

    if (auth.status === AuthStatus.Authenticated) {
        return <Navigate to='/profile' replace />;
    }

    return (
        <Container data-cy='landing-page' maxWidth={false} sx={{ py: 5 }}>
            <Grid container rowSpacing={4} columnSpacing={2}>
                <Grid item xs={12} md={6} justifyContent='center'>
                    <Stack
                        height={1}
                        justifyContent='center'
                        alignItems='center'
                        spacing={6}
                    >
                        <Stack alignItems='center' spacing={2}>
                            <Typography variant='h2' textAlign='center' data-cy='title'>
                                ChessDojo Scoreboard
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
                                offers structured training plans for all levels 0-2500,
                                along with an active and supportive community
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
                </Grid>

                <Grid item xs={12} md={6}>
                    <Stack height={1} justifyContent='center' alignItems='center'>
                        <img
                            alt=''
                            src='https://static.wixstatic.com/media/cfd2ae_25636fbb6a6c4d07b3559de681014ec4~mv2.gif'
                            width='100%'
                            style={{ borderRadius: '6px' }}
                        />
                    </Stack>
                </Grid>
            </Grid>
        </Container>
    );
};

export default LandingPage;
