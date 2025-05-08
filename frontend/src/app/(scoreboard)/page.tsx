'use client';

import { AuthStatus, useAuth } from '@/auth/Auth';
import background3 from '@/components/landing/background3.jpg';
import background4 from '@/components/landing/background4.png';
import { BackgroundImageContainer } from '@/components/landing/BackgroundImage';
import { Community } from '@/components/landing/Community';
import { Features } from '@/components/landing/Features';
import { anton, barlow, barlowCondensed } from '@/components/landing/fonts';
import { Pricing } from '@/components/landing/Pricing';
import { Senseis } from '@/components/landing/Senseis';
import { TestimonialSection } from '@/components/landing/Testimonial';
import { Link } from '@/components/navigation/Link';
import { useRouter } from '@/hooks/useRouter';
import LoadingPage from '@/loading/LoadingPage';
import SocialIcons from '@/navbar/SocialIcons';
import { ChessDojoIcon } from '@/style/ChessDojoIcon';
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
        <Box sx={{ '--stats-height': '110px' }}>
            <BackgroundImageContainer
                src={background4}
                background='linear-gradient(270deg, rgba(7, 7, 18, 0.765) 10%, rgba(7, 7, 18, 0.9) 100%)'
                slotProps={{
                    image: { style: { opacity: 0.3 } },
                    container: { sx: { py: 0 } },
                }}
            >
                <Grid
                    container
                    rowSpacing={4}
                    columnSpacing={2}
                    sx={{
                        alignItems: 'center',
                        height: {
                            md: 'calc(100vh - var(--navbar-height) - var(--stats-height) - 80px)',
                        },
                    }}
                >
                    <Grid
                        justifyContent='center'
                        size={{
                            xs: 12,
                        }}
                    >
                        <Stack height={1} justifyContent='start' alignItems='start' spacing={6}>
                            <Stack spacing={2}>
                                <Typography
                                    variant='h2'
                                    textAlign='start'
                                    data-cy='title'
                                    fontFamily={anton.style.fontFamily}
                                    fontWeight={anton.style.fontWeight}
                                >
                                    Start improving at chess today.
                                    <br />
                                    Learn the right way.
                                </Typography>
                                <Typography
                                    variant='h5'
                                    textAlign='start'
                                    data-cy='subtitle'
                                    sx={{
                                        fontFamily: barlow.style.fontFamily,
                                        fontWeight: 400,
                                        fontSize: '1.5rem',
                                        lineHeight: '2.125rem',
                                        letterSpacing: 0,
                                    }}
                                >
                                    No spare time, no study plan, overwhelmed by chess content? No
                                    problem.
                                    <br />
                                    The Dojo is built for real people, with real lives and real
                                    ambition to improve.
                                </Typography>
                            </Stack>

                            <Stack direction='row' spacing={3} alignItems='center'>
                                <Button
                                    variant='contained'
                                    component={Link}
                                    href='/signup'
                                    sx={{
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        py: 1.5,
                                        px: 2.5,
                                    }}
                                    color='dojoOrange'
                                >
                                    Join the Dojo
                                </Button>
                                <Button
                                    variant='outlined'
                                    component={Link}
                                    href={`/signin${searchParams?.redirectUri ? `?redirectUri=${searchParams.redirectUri.toString()}` : ''}`}
                                    sx={{
                                        fontSize: '0.94rem',
                                        fontWeight: '600',
                                        border: 0,
                                        borderBottomLeftRadius: 0,
                                        borderBottomRightRadius: 0,
                                        borderBottom:
                                            '3px solid var(--mui-palette-dojoOrange-main)',
                                        color: 'white',
                                        px: 1,
                                        '&:hover': {
                                            borderColor: 'var(--mui-palette-dojoOrange-dark)',
                                        },
                                    }}
                                    color='dojoOrange'
                                >
                                    Explore the Program
                                </Button>
                            </Stack>
                        </Stack>
                    </Grid>
                </Grid>
            </BackgroundImageContainer>

            <Box
                sx={{
                    width: 1,
                    height: 'var(--stats-height)',
                    background:
                        'linear-gradient(90deg, var(--mui-palette-darkBlue-main) 0%, var(--mui-palette-darkBlue-light) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography sx={{ fontSize: '1.5rem' }}>
                    Since its launch in 2022, ChessDojo members have gained more than{' '}
                    <strong>186,000</strong> rating points.
                </Typography>
            </Box>

            <Features />
            <TestimonialSection />
            <Community />
            <Pricing />
            <Senseis />

            <BackgroundImageContainer
                src={background3}
                background='linear-gradient(270deg, #141422 0%, #06060B 100%)'
            >
                <Stack alignItems='center'>
                    <Typography
                        sx={{
                            fontFamily: barlowCondensed.style.fontFamily,
                            fontWeight: '400',
                            fontSize: '3rem',
                            lineHeight: '3.5rem',
                            letterSpacing: 0,
                            textAlign: 'center',
                        }}
                    >
                        Join a community of people that love the game
                    </Typography>

                    <Button
                        variant='contained'
                        component={Link}
                        href='/signup'
                        sx={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            py: 1.5,
                            px: 2.5,
                            mt: '1.875rem',
                        }}
                        color='dojoOrange'
                    >
                        Sign Up
                    </Button>
                </Stack>
            </BackgroundImageContainer>

            <Box
                sx={{
                    width: 1,
                    height: 'var(--navbar-height)',
                    borderTop: '3px solid',
                    borderImage: 'linear-gradient(90deg, #1875EE 0%, #2A86FF 100%) 1',
                    backgroundImage: 'var(--mui-overlays-2)',
                }}
            >
                <Container maxWidth='lg' sx={{ height: 1 }}>
                    <Stack
                        direction='row'
                        justifyContent='space-between'
                        alignItems='center'
                        height={1}
                    >
                        <Stack direction='row' alignItems='center'>
                            <ChessDojoIcon />
                            <Button sx={{ color: 'white' }}>Blog</Button>
                            <Button sx={{ color: 'white' }}>Contact & Support</Button>
                            <Button sx={{ color: 'white' }}>Donate to the Dojo</Button>
                        </Stack>

                        <SocialIcons />
                    </Stack>
                </Container>
            </Box>
        </Box>
    );
};

export default LandingPage;
