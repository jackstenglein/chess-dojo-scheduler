import { useMemo } from 'react';
import { AxisOptions, Chart } from 'react-charts';
import { Box, Stack, Typography } from '@mui/material';

import { UserStatistics } from '../../database/statistics';
import { dojoCohorts } from '../../database/user';

interface ParticipantsChartProps {
    stats: UserStatistics;
}

const ParticipantsChart: React.FC<ParticipantsChartProps> = ({ stats }) => {
    const data = useMemo(() => {
        return [
            {
                label: 'Active',
                data: dojoCohorts.map((c) => ({
                    cohort: c,
                    value: stats.activeParticipants[c],
                })),
            },
            {
                label: 'Inactive',
                data: dojoCohorts.map((c) => ({
                    cohort: c,
                    value: stats.participants[c] - stats.activeParticipants[c],
                })),
            },
        ];
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
                stacked: true,
                formatters: {
                    scale: (value) => (value % 1 === 0 ? `${value}` : ''),
                },
            },
        ],
        []
    );

    return (
        <Stack>
            <Typography variant='subtitle1'>Participants</Typography>
            <Box height='200px'>
                <Chart options={{ data, primaryAxis, secondaryAxes }} />
            </Box>
        </Stack>
    );
};

export default ParticipantsChart;
