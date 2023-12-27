import { useMemo } from 'react';
import { Box, Card, CardContent, CardHeader, Stack, Typography } from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';

import { SectionProps } from './YearReviewPage';
import { AxisOptions, Chart } from 'react-charts';
import { YearReviewDataSection } from '../../database/yearReview';
import { CategoryColors, ScoreCategories } from '../activity/activity';
import { useAuth } from '../../auth/Auth';
import Percentiles from './Percentiles';

export interface Datum {
    primary: string;
    secondary: number;
}

export const primaryAxis: AxisOptions<Datum> = {
    position: 'left',
    getValue: (datum) => datum.primary,
};

export const secondaryAxes: Array<AxisOptions<Datum>> = [
    {
        position: 'bottom',
        getValue: (datum) => datum.secondary,
        min: 0,
    },
];

export function getCategoryData(
    label: string,
    data: YearReviewDataSection,
    nonDojo?: boolean
) {
    let categories = [...ScoreCategories];
    if (nonDojo) {
        categories = ['Welcome to the Dojo', ...categories, 'Non-Dojo'];
    }

    return [
        {
            label,
            data: categories.reverse().map((category) => ({
                primary: category,
                secondary: data.byCategory?.[category] || 0,
            })),
        },
    ];
}

const months: Record<string, string> = {
    Jan: '01',
    Feb: '02',
    Mar: '03',
    Apr: '04',
    May: '05',
    June: '06',
    July: '07',
    Aug: '08',
    Sep: '09',
    Oct: '10',
    Nov: '11',
    Dec: '12',
};

export function getMonthData(label: string, data: YearReviewDataSection) {
    return [
        {
            label,
            data: Object.entries(months)
                .sort((lhs, rhs) => rhs[1].localeCompare(lhs[1]))
                .map((month) => ({
                    primary: month[0],
                    secondary: data.byPeriod?.[month[1]] || 0,
                })),
        },
    ];
}

export function getTaskData(label: string, data: YearReviewDataSection) {
    if (!data.byTask) {
        return undefined;
    }
    return [
        {
            label,
            data: Object.entries(data.byTask)
                .sort((lhs, rhs) => rhs[1] - lhs[1])
                .slice(0, 10)
                .reverse()
                .map((datum) => ({
                    primary: datum[0],
                    secondary: datum[1],
                })),
        },
    ];
}

const DojoPointSection: React.FC<SectionProps> = ({ review }) => {
    const viewer = useAuth().user;
    const dark = !viewer?.enableLightMode;

    const data = review.total.dojoPoints;

    const categoryData = useMemo(() => getCategoryData('Dojo Points', data), [data]);
    const monthData = useMemo(() => getMonthData('Dojo Points', data), [data]);
    const taskData = useMemo(() => getTaskData('Dojo Points', data), [data]);

    return (
        <Stack width={1} alignItems='center'>
            <Typography
                variant='h6'
                fontWeight='800'
                fontSize='clamp(16px,3vw,32px)'
                textAlign='center'
            >
                The Dojo is all about sweat work! Let's take a look at the work you've
                done this year!
            </Typography>

            <Card variant='outlined' sx={{ width: 1, mt: 4 }}>
                <CardHeader title='Dojo Score' />
                <CardContent>
                    <Grid2 container alignItems='center' rowSpacing={2}>
                        <Grid2 xs={12} sm={4} display='flex' justifyContent='center'>
                            <Stack alignItems='end'>
                                <Typography variant='caption' color='text.secondary'>
                                    Total Points
                                </Typography>

                                <Typography
                                    sx={{
                                        fontSize: '2.25rem',
                                        lineHeight: 1,
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {Math.round(100 * data.total.value) / 100}
                                </Typography>
                            </Stack>
                        </Grid2>

                        <Percentiles
                            description='total Dojo points'
                            cohort={review.currentCohort}
                            percentile={data.total.percentile}
                            cohortPercentile={data.total.cohortPercentile}
                        />
                    </Grid2>

                    <Stack mt={4} spacing={4}>
                        <Stack alignItems='start' spacing={0.5}>
                            <Typography>Points by Category</Typography>
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
                            <Typography>Points by Month</Typography>
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

                        {taskData && (
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
                        )}
                    </Stack>
                </CardContent>
            </Card>
        </Stack>
    );
};

export default DojoPointSection;
