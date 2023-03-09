import { useEffect, useMemo, useState } from 'react';
import Tooltip from 'react-tooltip';
import { Box, Container, MenuItem, Stack, TextField, Typography } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import { PieChart } from 'react-minimal-pie-chart';

import { useApi } from '../api/Api';
import { useRequest } from '../api/Request';
import { Requirement } from '../database/requirement';
import { compareCohorts, User } from '../database/user';

const defaultLabelStyle = {
    fontSize: '5px',
    fontFamily: 'sans-serif',
};

const COLORS = [
    '#673ab7', // deep purple
    '#3f51b5', // indigo
    '#009688', // teal
    '#ff9800', // orange
    '#795548', // brown
    '#f44336', // red
    '#2196f3', // blue
    '#607d8b', // blue grey
];

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
                value: progress.minutesSpent[cohort] || 0,
                color: '',
            };
        }
    });

    const dataValues = Object.values(data);
    dataValues.forEach((value, idx) => (value.color = COLORS[idx % COLORS.length]));
    return dataValues;
}

function getPieChartTooltip(entry: PieChartData) {
    const hours = Math.floor(entry.value / 60);
    const minutes = entry.value % 60;
    return `${entry.name} - ${hours}h ${minutes}m`;
}

interface ActivityTabProps {
    user: User;
}

const ActivityTab: React.FC<ActivityTabProps> = ({ user }) => {
    const request = useRequest<Requirement[]>();
    const [cohort, setCohort] = useState(user.dojoCohort);
    const [hovered, setHovered] = useState<number | null>(null);
    const api = useApi();

    useEffect(() => {
        if (!request.isSent()) {
            api.listRequirements(cohort, false)
                .then((requirements) => {
                    request.onSuccess(requirements);
                })
                .catch((err) => {
                    console.error('listRequirements: ', err);
                    request.onFailure(err);
                });
        }
    }, [request, api, cohort]);

    const data = useMemo(() => {
        return getPieChartData(request.data || [], user, cohort);
    }, [request.data, user, cohort]);

    const cohortOptions = useMemo(() => {
        return Object.values(user.progress)
            .map((v) => Object.keys(v.minutesSpent))
            .flat()
            .sort(compareCohorts)
            .filter((item, pos, ary) => !pos || item !== ary[pos - 1]);
    }, [user.progress]);

    const onChangeCohort = (cohort: string) => {
        setCohort(cohort);
        request.reset();
    };

    return (
        <Stack spacing={2} justifyContent='center' alignItems='center'>
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

            {data.length === 0 && <Typography>No data</Typography>}

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
                    <Stack direction='row' spacing={2} justifyContent='center' mt={2}>
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

export default ActivityTab;
