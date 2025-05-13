import { fontFamily } from '@/style/font';
import { Container, Divider, Grid, Stack, Typography } from '@mui/material';
import { BulletPoint } from './BulletPoint';
import { communityBulletPoints } from './bulletPoints';
import { barlow, barlowCondensed } from './fonts';
import { JoinDojoButton } from './JoinDojoButton';

export function Community() {
    return (
        <Container maxWidth='lg' sx={{ py: '5.5rem' }}>
            <Grid container spacing='2rem'>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Stack
                        sx={{
                            gap: '1.5rem',
                            position: { xs: 'unset', md: 'sticky' },
                            top: 'calc(var(--navbar-height) + 1rem)',
                        }}
                        alignItems={{ xs: 'center', md: 'start' }}
                    >
                        <Typography
                            sx={{
                                fontSize: '3rem',
                                lineHeight: '3.375rem',
                                fontFamily: (theme) => fontFamily(theme, barlowCondensed),
                                fontWeight: '500',
                                textAlign: { xs: 'center', md: 'start' },
                            }}
                        >
                            You don't have to improve alone
                        </Typography>

                        <Divider
                            sx={{
                                height: '3px',
                                background:
                                    'linear-gradient(90deg, var(--mui-palette-darkBlue-main) 0%, var(--mui-palette-darkBlue-light) 100%)',
                                width: 0.37,
                            }}
                        />

                        <Typography
                            sx={{
                                fontFamily: (theme) => fontFamily(theme, barlow),
                                fontSize: '1.5rem',
                                lineHeight: '2.125rem',
                                textAlign: { xs: 'center', md: 'start' },
                            }}
                        >
                            When you join ChessDojo, you become part of a thriving community of
                            chess improvers from beginner to Grandmaster
                        </Typography>
                    </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                    <Grid container spacing='2rem' justifyContent={{ xs: 'center', md: 'start' }}>
                        {communityBulletPoints.map((bp) => (
                            <Grid size={{ xs: 11, md: 6 }} key={bp.title}>
                                <BulletPoint {...bp} />
                            </Grid>
                        ))}

                        <Grid size={12} display='flex' justifyContent='center' mt={3}>
                            <JoinDojoButton />
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Container>
    );
}
