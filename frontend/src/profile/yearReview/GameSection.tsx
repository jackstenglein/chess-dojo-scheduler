import { useMemo } from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2';
import { Chart } from 'react-charts';

import { SectionProps } from './YearReviewPage';
import Percentiles from './Percentiles';
import { getMonthData, primaryAxis, secondaryAxes } from './DojoPointSection';
import { YearReviewDataSection } from '../../database/yearReview';
import { useAuth } from '../../auth/Auth';

const GameSection: React.FC<SectionProps> = ({ review }) => {
    const viewer = useAuth().user;
    const dark = !viewer?.enableLightMode;

    const data = review.total.games;

    const monthData = useMemo(
        () => getMonthData('Games Submitted', data as YearReviewDataSection),
        [data]
    );

    return (
        <Stack width={1} alignItems='center'>
            <Typography
                variant='h6'
                fontWeight='800'
                fontSize='clamp(16px,3vw,32px)'
                textAlign='center'
            >
                Finally, we all know analyzing your own games is a cornerstone of the
                Dojo, so let's see how many you've analyzed!
            </Typography>

            <Card variant='outlined' sx={{ width: 1, mt: 4 }}>
                <CardContent>
                    <Grid2 container alignItems='center' rowSpacing={2}>
                        <Grid2 xs={12} sm={4} display='flex' justifyContent='center'>
                            <Stack alignItems='end'>
                                <Typography variant='caption' color='text.secondary'>
                                    Analyses Submitted
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
                            description='submitted games'
                            cohort={review.currentCohort}
                            percentile={data.total.percentile}
                            cohortPercentile={data.total.cohortPercentile}
                        />
                    </Grid2>

                    <Stack mt={4} spacing={4}>
                        <Stack alignItems='start' spacing={0.5}>
                            <Typography>Analyses by Month</Typography>
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
