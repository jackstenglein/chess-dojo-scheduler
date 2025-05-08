import { ArrowForward, Close } from '@mui/icons-material';
import { Box, Button, Grid, Link, Stack, Typography } from '@mui/material';
import backgroundImage from './background2.jpg';
import { BackgroundImageContainer } from './BackgroundImage';
import { BulletPoint } from './BulletPoint';
import { freeBulletPoints, membershipBulletPoints } from './bulletPoints';
import { barlow, barlowCondensed } from './fonts';

export function Pricing() {
    return (
        <BackgroundImageContainer
            src={backgroundImage}
            background='linear-gradient(270deg, #141422 0%, #06060B 100%)'
        >
            <Stack gap='1rem' alignItems='center'>
                <Typography
                    sx={{ textTransform: 'uppercase' }}
                    color='dojoOrange'
                    fontWeight='600'
                    fontSize='1.1875rem'
                    lineHeight='1.1875rem'
                    letterSpacing='11%'
                >
                    Start Getting Better at Chess Today
                </Typography>

                <Typography
                    sx={{
                        fontFamily: barlowCondensed.style.fontFamily,
                        fontSize: '3rem',
                        lineHeight: '3.5rem',
                        textAlign: 'center',
                    }}
                >
                    We've done the hard work putting
                    <br />
                    together a comprehensive training plan.
                    <br />
                    <span style={{ fontWeight: '600' }}>You just need to follow it.</span>
                </Typography>
            </Stack>

            <Stack mt='4.0625rem' gap='1.5rem' alignItems='center'>
                <MembershipSection />
                <FreeSection />
            </Stack>
        </BackgroundImageContainer>
    );
}

function MembershipSection() {
    return (
        <Box
            sx={{
                background: 'linear-gradient(180deg, #1B1B2C 0%, #06060B 100%)',
                padding: '3.75rem 3.375rem',
                borderRadius: 1,
            }}
        >
            <Stack
                direction='row'
                sx={{
                    justifyContent: 'space-between',
                    borderBottom: '3px solid',
                    paddingBottom: '1.875rem',
                    borderImage: 'linear-gradient(90deg, #F08B32 0%, #F0AA32 100%) 1',
                }}
            >
                <Stack>
                    <Typography
                        sx={{
                            fontFamily: barlowCondensed.style.fontFamily,
                            fontSize: '3rem',
                            fontWeight: '500',
                            lineHeight: '3.375rem',
                        }}
                    >
                        ChessDojo Membership
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: barlow.style.fontFamily,
                            fontSize: '1.1875rem',
                            lineHeight: '1.9375rem',
                            color: 'rgba(255, 255, 255, 0.9)',
                        }}
                    >
                        Select between monthly and annual pricing options
                    </Typography>
                </Stack>

                <Stack>
                    <Typography
                        sx={{
                            fontFamily: barlow.style.fontFamily,
                            fontWeight: '400',
                            fontSize: '3rem',
                            lineHeight: '3.375rem',
                            textAlign: 'right',
                            letterSpacing: '0%',
                        }}
                    >
                        $<span style={{ fontWeight: '300', fontSize: '5.125rem' }}>120</span>
                    </Typography>
                    <Typography
                        color='dojoOrange'
                        sx={{
                            textTransform: 'uppercase',
                            fontWeight: '700',
                            fontSize: '0.8125rem',
                            letterSpacing: '8%',
                            lineHeight: '1.375rem',
                            textAlign: 'right',
                        }}
                    >
                        Each Year
                    </Typography>
                </Stack>
            </Stack>

            <Grid container sx={{ mt: '3.75rem' }} spacing='1.375rem'>
                {membershipBulletPoints.map((bp) => (
                    <Grid key={bp.title} size={4}>
                        <BulletPoint {...bp} icon={<ArrowForward color='dojoOrange' />} />
                    </Grid>
                ))}
            </Grid>

            <Stack
                direction='row'
                justifyContent='space-between'
                alignItems='center'
                sx={{ mt: '3.75rem' }}
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
                        mt: 3,
                    }}
                    color='dojoOrange'
                >
                    Join the Dojo
                </Button>

                <Stack direction='row' gap='0.5rem'>
                    <Button
                        variant='contained'
                        sx={{
                            fontSize: '0.8125rem',
                            fontWeight: '700',
                            py: '0.875rem',
                            px: '1.75rem',
                            letterSpacing: '8%',
                            lineHeight: '1.375rem',
                        }}
                        color='dojoOrange'
                    >
                        Annual
                    </Button>

                    <Button
                        variant='outlined'
                        sx={{
                            fontSize: '0.8125rem',
                            fontWeight: '700',
                            py: '0.875rem',
                            px: '1.75rem',
                            letterSpacing: '8%',
                            lineHeight: '1.375rem',
                        }}
                        color='dojoOrange'
                    >
                        Monthly
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
}

function FreeSection() {
    return (
        <Stack
            width={0.83}
            sx={{
                padding: '2rem 3.375rem',
            }}
        >
            <Stack
                sx={{
                    borderBottom: '3px solid',
                    paddingBottom: '1.5rem',
                    borderImage:
                        'linear-gradient(90deg, var(--mui-palette-darkBlue-main) 0%, var(--mui-palette-darkBlue-light) 100%) 1',
                }}
            >
                <Typography
                    sx={{
                        fontFamily: barlowCondensed.style.fontFamily,
                        fontSize: '2rem',
                        fontWeight: '500',
                        lineHeight: '2rem',
                    }}
                >
                    Free Membership
                </Typography>
                <Typography
                    sx={{
                        fontFamily: barlow.style.fontFamily,
                        fontSize: '1.1875rem',
                        lineHeight: '1.9375rem',
                        color: 'rgba(255, 255, 255, 0.9)',
                    }}
                >
                    Access to basic training plans and a limited game database
                </Typography>
            </Stack>

            <Grid container sx={{ mt: '1.875rem' }} spacing='1.375rem'>
                {freeBulletPoints.map((bp) => (
                    <Grid key={bp.title} size={4}>
                        <BulletPoint
                            title={bp.title}
                            icon={
                                bp.excluded ? (
                                    <Close sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                ) : undefined
                            }
                            slotProps={{
                                root: {
                                    gap: '0.5rem',
                                },
                                title: {
                                    sx: {
                                        textTransform: 'uppercase',
                                        fontFamily: barlowCondensed.style.fontFamily,
                                        fontWeight: '600',
                                        fontSize: '1.1875rem',
                                        letterSpacing: '3%',
                                        lineHeight: 1,
                                        color: bp.excluded ? 'rgba(255, 255, 255, 0.5)' : undefined,
                                    },
                                },
                            }}
                        />
                    </Grid>
                ))}
            </Grid>

            <Button
                variant='outlined'
                component={Link}
                sx={{
                    mt: '1.875rem',
                    fontSize: '0.94rem',
                    fontWeight: '600',
                    border: 0,
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    borderBottom: '3px solid var(--mui-palette-darkBlue-main)',
                    color: 'white',
                    px: 1,
                    alignSelf: 'start',
                    '&:hover': {
                        borderColor: 'var(--mui-palette-darkBlue-dark)',
                    },
                }}
                color='darkBlue'
            >
                Sign Up For Free
            </Button>
        </Stack>
    );
}
