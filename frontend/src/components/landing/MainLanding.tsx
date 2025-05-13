import { Box, Button, Grid, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import { BackgroundImageContainer } from './BackgroundImage';
import { anton, barlow } from './fonts';
import heroImage from './hero.webp';
import backgroundImage from './main-background.webp';

export function MainLanding({
    searchParams,
}: {
    searchParams?: Record<string, string | string[] | undefined>;
}) {
    return (
        <>
            <BackgroundImageContainer
                src={backgroundImage}
                background='linear-gradient(270deg, rgba(7, 7, 18, 0.765) 10%, rgba(7, 7, 18, 0.9) 100%)'
                slotProps={{
                    image: { style: { opacity: 0.15 }, priority: true },
                    container: { sx: { pt: 0, pb: { xs: 3, md: 0 } } },
                }}
            >
                <Grid
                    container
                    rowSpacing={4}
                    sx={{
                        alignItems: 'center',
                        height: {
                            md: 'calc(100vh - var(--navbar-height) - var(--stats-height) - 40px)',
                        },
                        mt: {
                            xs: 1,
                            md: 0,
                        },
                    }}
                >
                    <Grid
                        size={{
                            xs: 12,
                            md: 6,
                        }}
                    >
                        <Stack
                            height={1}
                            justifyContent='start'
                            alignItems={{ xs: 'center', md: 'start' }}
                            spacing={6}
                        >
                            <Stack spacing={2}>
                                <Typography
                                    variant='h2'
                                    textAlign={{ xs: 'center', md: 'start' }}
                                    data-cy='title'
                                    fontFamily={anton.style.fontFamily}
                                    fontWeight={anton.style.fontWeight}
                                >
                                    Got Mated?
                                    <br />
                                    Time to join the ChessDojo!
                                </Typography>
                                <Typography
                                    variant='h5'
                                    textAlign={{ xs: 'center', md: 'start' }}
                                    data-cy='subtitle'
                                    sx={{
                                        fontFamily: barlow.style.fontFamily,
                                        fontWeight: 400,
                                        fontSize: '1.5rem',
                                        lineHeight: '2.125rem',
                                        letterSpacing: 0,
                                    }}
                                >
                                    A chess training plan for every level and a community to do it
                                    with.
                                </Typography>
                            </Stack>

                            <Stack
                                direction='row'
                                sx={{
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                    justifyContent: { xs: 'center', md: 'start' },
                                    gap: 3,
                                }}
                            >
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

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Image
                            alt=''
                            src={heroImage}
                            style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                            priority
                        />
                    </Grid>
                </Grid>
            </BackgroundImageContainer>

            <Box
                sx={{
                    width: 1,
                    height: { xs: 'auto', md: 'var(--stats-height)' },
                    background:
                        'linear-gradient(90deg, var(--mui-palette-darkBlue-main) 0%, var(--mui-palette-darkBlue-light) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: { xs: 0.5, md: 0 },
                }}
            >
                <Typography sx={{ fontSize: '1.5rem' }} textAlign='center'>
                    Since its launch in 2022, ChessDojo members have gained more than{' '}
                    <strong>186,000</strong> rating points.
                </Typography>
            </Box>
        </>
    );
}
