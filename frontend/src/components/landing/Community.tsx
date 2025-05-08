import { Button, Container, Divider, Grid, Link, Stack, Typography } from '@mui/material';
import { BulletPoint } from './BulletPoint';
import { communityBulletPoints } from './bulletPoints';
import { barlow, barlowCondensed } from './fonts';

export function Community() {
    return (
        <Container maxWidth='lg' sx={{ py: '5.5rem' }}>
            <Grid container spacing='2rem'>
                <Grid size={4}>
                    <Stack
                        sx={{
                            gap: '1.5rem',
                            position: 'sticky',
                            top: 'calc(var(--navbar-height) + 1rem)',
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: '3rem',
                                lineHeight: '3.375rem',
                                fontFamily: barlowCondensed.style.fontFamily,
                                fontWeight: '500',
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
                                fontFamily: barlow.style.fontFamily,
                                fontSize: '1.5rem',
                                lineHeight: '2.125rem',
                            }}
                        >
                            When you join ChessDojo, you become part of a thriving community of
                            chess improvers from beginner to Grandmaster
                        </Typography>
                    </Stack>
                </Grid>

                <Grid size={8}>
                    <Grid container spacing='2rem'>
                        {communityBulletPoints.map((bp) => (
                            <Grid size={6} key={bp.title}>
                                <BulletPoint {...bp} />
                            </Grid>
                        ))}

                        <Grid size={12} display='flex' justifyContent='center'>
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
                                color='darkBlue'
                            >
                                Join the Dojo
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Container>
    );
}
