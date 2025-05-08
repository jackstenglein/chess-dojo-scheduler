import { Button, Container, Grid, Link, Typography } from '@mui/material';
import { BulletPoint } from './BulletPoint';
import { trainingPlanBulletPoints } from './bulletPoints';
import { barlowCondensed } from './fonts';

export function Features() {
    return (
        <Container maxWidth='lg' sx={{ py: '5.5rem' }}>
            <Grid container spacing='2rem'>
                <Grid size={4}>
                    <Typography
                        sx={{
                            fontSize: '3rem',
                            lineHeight: '3.375rem',
                            fontFamily: barlowCondensed.style.fontFamily,
                            fontWeight: 500,
                            letterSpacing: 0,
                            position: 'sticky',
                            top: 'calc(var(--navbar-height) + 1rem)',
                        }}
                    >
                        Rating-based training plans for players of all levels from 0-2500
                    </Typography>
                </Grid>

                <Grid size={8}>
                    <Grid container spacing='2rem'>
                        {trainingPlanBulletPoints.map((bp) => (
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
