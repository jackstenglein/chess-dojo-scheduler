import { useState, useMemo } from 'react';
import { Stack, TextField, MenuItem, Typography, Container, Box } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import { PieChart } from 'react-minimal-pie-chart';
import Tooltip from 'react-tooltip';

import { Requirement } from '../../database/requirement';
import { compareCohorts, User } from '../../database/user';
import { CategoryColors } from './activity';
import { useRequirements } from '../../api/cache/requirements';

const defaultLabelStyle = {
    fontSize: '5px',
    fontFamily: 'sans-serif',
};

interface PieChartData {
    requirementId: string;
    name: string;
    value: number;
    color: string;
}

function getPieChartData(
    requirements: Requirement[],
    user: User,
    cohort: string
): PieChartData[] {
    const requirementMap =
        requirements.reduce((map, r) => {
            map[r.id] = r;
            return map;
        }, {} as Record<string, Requirement>) ?? {};

    const data: Record<string, PieChartData> = {};
    Object.values(user.progress).forEach((progress) => {
        if (!progress.minutesSpent[cohort]) {
            return;
        }
        const requirement = requirementMap[progress.requirementId];
        if (!requirement) {
            return;
        }
        const categoryName = requirement.category;
        if (data[categoryName]) {
            data[categoryName].value += progress.minutesSpent[cohort];
        } else {
            data[categoryName] = {
                requirementId: requirement.id,
                name: categoryName,
                value: progress.minutesSpent[cohort],
                color: CategoryColors[requirement.category],
            };
        }
    });

    return Object.values(data);
}

function getPieChartTooltip(entry: PieChartData) {
    const hours = Math.floor(entry.value / 60);
    const minutes = entry.value % 60;
    return `${entry.name} - ${hours}h ${minutes}m`;
}

interface ActivityPieChartProps {
    user: User;
}

const ActivityPieChart: React.FC<ActivityPieChartProps> = ({ user }) => {
    const [cohort, setCohort] = useState(user.dojoCohort);
    const [hovered, setHovered] = useState<number | null>(null);
    const { requirements } = useRequirements(cohort, false);

    const data = useMemo(() => {
        return getPieChartData(requirements, user, cohort);
    }, [requirements, user, cohort]);

    const cohortOptions = useMemo(() => {
        return Object.values(user.progress)
            .map((v) => Object.keys(v.minutesSpent))
            .flat()
            .concat(user.dojoCohort)
            .sort(compareCohorts)
            .filter((item, pos, ary) => !pos || item !== ary[pos - 1]);
    }, [user.progress, user.dojoCohort]);

    const onChangeCohort = (cohort: string) => {
        setCohort(cohort);
    };

    return (
        <Stack
            spacing={2}
            justifyContent='center'
            alignItems='center'
            position={{
                xs: 'static',
                sm: 'sticky',
            }}
            top={{
                xs: 0,
                sm: '88px',
            }}
        >
            <Typography variant='h6' alignSelf='start'>
                Time Breakdown
            </Typography>
            <TextField
                select
                label='Cohort'
                value={cohort}
                onChange={(event) => onChangeCohort(event.target.value)}
                sx={{ mb: 3 }}
                fullWidth
            >
                {cohortOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                        {option}
                    </MenuItem>
                ))}
            </TextField>

            {data.length === 0 && (
                <Typography sx={{ paddingTop: 2 }}>No time data</Typography>
            )}

            {data.length > 0 && (
                <Container maxWidth='sm'>
                    <Box data-tip='' data-for='chart'>
                        <PieChart
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
                            id='chart'
                            getContent={() =>
                                hovered === null
                                    ? undefined
                                    : getPieChartTooltip(data[hovered])
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

export default ActivityPieChart;
