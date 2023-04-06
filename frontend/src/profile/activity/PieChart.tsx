import { Box, Container, Stack, Typography } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import { PieChart as ReactPieChart } from 'react-minimal-pie-chart';
import Tooltip from 'react-tooltip';
import { useState } from 'react';

const defaultLabelStyle = {
    fontSize: '5px',
    fontFamily: 'sans-serif',
};

export interface PieChartData {
    name: string;
    value: number;
    color: string;
}

interface PieChartProps {
    id: string;
    title: string;
    subtitle?: string;
    data: PieChartData[];
    getTooltip: (entry: PieChartData) => string;
}

const PieChart: React.FC<PieChartProps> = ({ id, title, subtitle, data, getTooltip }) => {
    const [hovered, setHovered] = useState<number | null>(null);

    return (
        <Stack justifyContent='center' alignItems='center'>
            <Typography variant='h6'>{title}</Typography>
            {subtitle && <Typography variant='subtitle1'>{subtitle}</Typography>}

            {data.length === 0 && <Typography>No data</Typography>}

            {data.length > 0 && (
                <Container maxWidth='sm' sx={{ mt: 1 }}>
                    <Box data-tip='' data-for={id}>
                        <ReactPieChart
                            label={({ dataEntry }) =>
                                `${Math.round(dataEntry.percentage)}%`
                            }
                            labelStyle={defaultLabelStyle}
                            labelPosition={65}
                            data={data}
                            onMouseOver={(_, index) => {
                                setHovered(index);
                            }}
                            onMouseOut={() => {
                                setHovered(null);
                            }}
                        />
                        <Tooltip
                            id={id}
                            getContent={() =>
                                hovered === null ? undefined : getTooltip(data[hovered])
                            }
                        />
                    </Box>
                    <Stack
                        direction='row'
                        spacing={2}
                        justifyContent='center'
                        mt={2}
                        flexWrap='wrap'
                        rowGap={1}
                    >
                        {data.map((d) => (
                            <Stack key={d.name} direction='row' alignItems='center'>
                                <CircleIcon sx={{ color: d.color }} />
                                <Typography ml={'2px'}>{d.name}</Typography>
                            </Stack>
                        ))}
                    </Stack>
                </Container>
            )}
        </Stack>
    );
};

export default PieChart;
