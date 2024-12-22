import { useAuth } from '@/auth/Auth';
import { YearReviewDataSection } from '@/database/yearReview';
import { Box, Card, CardContent, Grid2, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';
import { Chart } from 'react-charts';
import { getMonthData, primaryAxis, secondaryAxes } from './DojoPointSection';
import Percentiles from './Percentiles';
import { SectionProps } from './section';

const GameSection = ({ review }: SectionProps) => {
    const viewer = useAuth().user;
    const dark = !viewer?.enableLightMode;

    const data = review.total.games;

    const monthData = useMemo(
        () => getMonthData('Games Submitted', data as YearReviewDataSection),
        [data],
    );

    const resultData = useMemo(() => {
        return [
            {
                label: 'Games',
                data: [
                    {
                        primary: 'Analysis',
                        secondary: data.analysis.value,
                        style: { fill: 'var(--mui-palette-primary-dark)' },
                    },
                    {
                        primary: 'Loss',
                        secondary: data.loss.value,
                        style: { fill: 'var(--mui-palette-error-main' },
                    },
                    {
                        primary: 'Draw',
                        secondary: data.draw.value,
                        style: { fill: 'var(--mui-palette-warning-light)' },
                    },
                    {
                        primary: 'Win',
                        secondary: data.win.value,
                        style: { fill: 'var(--mui-palette-success-main)' },
                    },
                ],
            },
        ];
    }, [data]);

    return (
        <Stack width={1} alignItems='center'>
            <Typography
                variant='h6'
                fontWeight='800'
                fontSize='clamp(16px,3vw,32px)'
                textAlign='center'
            >
                Finally, we all know analyzing your own games is a cornerstone of the
                Dojo, so let's check your game stats!
            </Typography>
            <Card variant='outlined' sx={{ width: 1, mt: 4 }}>
                <CardContent>
                    <Grid2 container alignItems='center' rowSpacing={2}>
                        <Grid2
                            display='flex'
                            justifyContent='center'
                            size={{
                                xs: 12,
                                sm: 4,
                            }}
                        >
                            <Stack alignItems='center'>
                                <Typography variant='caption' color='text.secondary'>
                                    Total Games
                                </Typography>

                                <Typography
                                    sx={{
                                        fontSize: '2.25rem',
                                        lineHeight: 1,
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {data.total.value}
                                </Typography>
                            </Stack>
                        </Grid2>

                        <Percentiles
                            description='total games'
                            cohort={review.currentCohort}
                            percentile={data.total.percentile}
                            cohortPercentile={data.total.cohortPercentile}
                        />
                    </Grid2>

                    <Stack mt={4} spacing={4}>
                        <Stack alignItems='start' spacing={0.5}>
                            <Typography>Games by Result</Typography>
                            <Box width={1} height={400} mt={2}>
                                <Chart
                                    options={{
                                        data: resultData,
                                        primaryAxis,
                                        secondaryAxes,
                                        dark,
                                        getDatumStyle(datum) {
                                            return datum.originalDatum.style;
                                        },
                                    }}
                                />
                            </Box>
                        </Stack>
                    </Stack>

                    <Stack mt={4} spacing={4}>
                        <Stack alignItems='start' spacing={0.5}>
                            <Typography>Games by Month</Typography>
                            <Box width={1} height={400} mt={2}>
                                <Chart
                                    options={{
                                        data: monthData,
                                        primaryAxis,
                                        secondaryAxes,
                                        dark,
                                    }}
                                />
                            </Box>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
        </Stack>
    );
};

export default GameSection;
