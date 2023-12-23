import { useMemo } from 'react';
import { Stack, Typography, Card, CardHeader, CardContent, Box } from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2';
import { AxisOptions, Chart } from 'react-charts';

import { useAuth } from '../../auth/Auth';
import { SectionProps } from './YearReviewPage';
import {
    Datum,
    getCategoryData,
    getMonthData,
    getTaskData,
    primaryAxis,
} from './DojoPointSection';
import { formatTime } from '../../database/requirement';
import { CategoryColors } from '../activity/activity';
import Percentiles from './Percentiles';

const secondaryAxes: Array<AxisOptions<Datum>> = [
    {
        position: 'bottom',
        getValue: (datum) => datum.secondary,
        formatters: {
            scale: formatTime,
        },
    },
];

const TimeSection: React.FC<SectionProps> = ({ review }) => {
    const viewer = useAuth().user;
    const dark = !viewer?.enableLightMode;

    const data = review.total.minutesSpent;

    const categoryData = useMemo(() => getCategoryData('Time Spent', data, true), [data]);
    const monthData = useMemo(() => getMonthData('Time Spent', data), [data]);
    const taskData = useMemo(() => getTaskData('Time Spent', data), [data]);

    return (
        <Stack width={1} alignItems='center'>
            <Typography
                variant='h6'
                fontWeight='800'
                fontSize='clamp(16px,3vw,32px)'
                textAlign='center'
            >
                Now let's see how long it took to earn all those Dojo points!
            </Typography>

            <Card variant='outlined' sx={{ width: 1, mt: 4 }}>
                <CardHeader title='Time Spent' />
                <CardContent>
                    <Grid2 container alignItems='center' rowSpacing={2}>
                        <Grid2 xs={12} sm={4} display='flex' justifyContent='center'>
                            <Stack alignItems='end'>
                                <Typography variant='caption' color='text.secondary'>
                                    Total Time
                                </Typography>

                                <Typography
                                    sx={{
                                        fontSize: '2.25rem',
                                        lineHeight: 1,
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {formatTime(data.total.value)}
                                </Typography>
                            </Stack>
                        </Grid2>

                        <Percentiles
                            cohort={review.currentCohort}
                            percentile={data.total.percentile}
                            cohortPercentile={data.total.cohortPercentile}
                        />
                    </Grid2>

                    <Stack mt={4} spacing={4}>
                        <Stack alignItems='start' spacing={0.5}>
                            <Typography>Time by Category</Typography>
                            <Box width={1} height={300} mt={2}>
                                <Chart
                                    options={{
                                        data: categoryData,
                                        primaryAxis,
                                        secondaryAxes,
                                        dark,
                                        getDatumStyle: (datum) => ({
                                            color: CategoryColors[
                                                datum.originalDatum.primary
                                            ],
                                        }),
                                    }}
                                />
                            </Box>
                        </Stack>

                        <Stack alignItems='start' spacing={0.5}>
                            <Typography>Time by Month</Typography>
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

                        <Stack alignItems='start' spacing={0.5}>
                            <Typography>Top 10 Tasks</Typography>
                            <Box width={1} height={400} mt={2}>
                                <Chart
                                    options={{
                                        data: taskData,
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

export default TimeSection;
