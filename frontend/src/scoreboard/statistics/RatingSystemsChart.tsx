import { useMemo } from 'react';
import { AxisOptions, Chart } from 'react-charts';
import { Box, Stack, Typography } from '@mui/material';

import { UserStatistics } from '../../database/statistics';
import { RatingSystem, dojoCohorts, formatRatingSystem } from '../../database/user';

interface RatingSystemsChartProps {
    stats: UserStatistics;
}

const RatingSystemsChart: React.FC<RatingSystemsChartProps> = ({ stats }) => {
    const data = useMemo(() => {
        return Object.values(RatingSystem).map((rs) => ({
            label: formatRatingSystem(rs),
            data: dojoCohorts.map((c) => ({
                cohort: c,
                value: stats.ratingSystems[c][rs],
            })),
        }));
    }, [stats]);

    const primaryAxis = useMemo<AxisOptions<(typeof data)[number]['data'][number]>>(
        () => ({
            getValue: (datum) => datum.cohort,
        }),
        []
    );

    const secondaryAxes = useMemo<AxisOptions<(typeof data)[number]['data'][number]>[]>(
        () => [
            {
                scaleType: 'linear',
                getValue: (datum) => datum.value,
                formatters: {
                    scale: (value) => (value % 1 === 0 ? `${value}` : ''),
                },
            },
        ],
        []
    );

    console.log('Data: ', data);

    return (
        <Stack>
            <Typography variant='subtitle1'>Rating Systems</Typography>
            <Box height='200px'>
                <Chart options={{ data, primaryAxis, secondaryAxes }} />
            </Box>
        </Stack>
    );
};

export default RatingSystemsChart;
