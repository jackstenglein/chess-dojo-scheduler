'use client';

import { AuthStatus, useAuth } from '@/auth/Auth';
import { Link } from '@/components/navigation/Link';
import { useRouter } from '@/hooks/useRouter';
import JoinToday from '@/landing/JoinToday';
import Sensei from '@/landing/Sensei';
import Testimonials from '@/landing/Testimonials';
import WhatsIncluded from '@/landing/WhatsIncluded';
import LoadingPage from '@/loading/LoadingPage';
import { Box, Button, Container, Grid, Stack, Typography } from '@mui/material';
import { Hub } from 'aws-amplify/utils';
import { useEffect } from 'react';

const LandingPage = ({
    searchParams,
}: {
    searchParams?: Record<string, string | string[] | undefined>;
}) => {
    const auth = useAuth();
    const router = useRouter();

    useEffect(() => {
        return Hub.listen('auth', (data) => {
            switch (data?.payload?.event) {
                case 'customOAuthState':
                    if (data.payload.data) {
                        router.push(data.payload.data);
                    }
            }
        });
    }, [router]);

    if (searchParams?.code && auth.status === AuthStatus.Loading) {
        return <LoadingPage />;
    }

    if (auth.status === AuthStatus.Authenticated) {
        router.replace('/profile');
        return <LoadingPage />;
    }

    return (
        <Container data-cy='landing-page' sx={{ py: 5 }} maxWidth='xl'>
            <Box
                sx={{
                    height: { md: 'calc(100vh - var(--navbar-height) - 200px)' },
                    mb: { xs: 4, md: 0 },
                }}
            >
                <Grid container rowSpacing={4} columnSpacing={2}>
                    <Grid
                        justifyContent='center'
                        size={{
                            xs: 12,
                            md: 6,
                        }}
                    >
                        <Stack height={1} justifyContent='center' alignItems='center' spacing={6}>
                            <Stack alignItems='center' spacing={2}>
                                <Typography variant='h2' textAlign='center' data-cy='title'>
                                    ChessDojo
                                </Typography>
                                <Typography variant='h5' textAlign='center' data-cy='subtitle'>
                                    The ChessDojo{' '}
                                    <Typography
                                        variant='h5'
                                        color='dojoOrange.main'
                                        component='span'
                                    >
                                        Training Program
                                    </Typography>{' '}
                                    offers structured training plans for all levels 0-2500, along
                                    with an active and supportive community
                                </Typography>
                            </Stack>

                            <Stack direction='row' spacing={3}>
                                <Button
                                    variant='contained'
                                    component={Link}
                                    href='/signup'
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
                                    component={Link}
                                    href={`/signin${searchParams?.redirectUri ? `?redirectUri=${searchParams.redirectUri.toString()}` : ''}`}
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

                    <Grid
                        size={{
                            xs: 12,
                            md: 6,
                        }}
                    >
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
                    </Grid>
                </Grid>
            </Box>
            <WhatsIncluded />
            <Sensei />
            <Testimonials />
            <JoinToday />
        </Container>
    );
};

export default LandingPage;
