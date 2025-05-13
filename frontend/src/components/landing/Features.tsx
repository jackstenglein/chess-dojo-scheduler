import { fontFamily } from '@/style/font';
import { Container, Grid, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import { BulletPoint } from './BulletPoint';
import { trainingPlanBulletPoints } from './bulletPoints';
import mockUIImage from './features-mock.webp';
import { barlowCondensed } from './fonts';
import { JoinDojoButton } from './JoinDojoButton';

export function Features() {
    return (
        <Container maxWidth='lg' sx={{ py: '5.5rem' }}>
            <Grid container spacing='2rem'>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Stack alignItems={{ xs: 'center', md: 'start' }}>
                        <Typography
                            sx={{
                                fontSize: '3rem',
                                lineHeight: '3.375rem',
                                fontFamily: (theme) => fontFamily(theme, barlowCondensed),
                                fontWeight: 500,
                                letterSpacing: 0,
                                textAlign: { xs: 'center', md: 'start' },
                            }}
                        >
                            ChessDojo can take you from 0-2400+ with our innovative training plan
                            and features
                        </Typography>

                        <Stack sx={{ my: '2.5rem', gap: '1.25rem' }}>
                            {trainingPlanBulletPoints.map((bp) => (
                                <BulletPoint
                                    key={bp.title}
                                    {...bp}
                                    slotProps={{
                                        description: { mt: '-0.25rem' },
                                    }}
                                />
                            ))}
                        </Stack>

                        <JoinDojoButton />
                    </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Image
                        alt=''
                        src={mockUIImage}
                        style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                    />
                </Grid>
            </Grid>
        </Container>
    );
}
