import { Button, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMemo, useState } from 'react';

import { useRequirements } from '../../api/cache/requirements';
import { ALL_COHORTS, compareCohorts, User } from '../../database/user';
import MultipleSelectChip from '../../newsfeed/list/MultipleSelectChip';
import {
    displayTimeframe,
    getScoreChartData,
    getTimeChartData,
    Timeframe,
} from './activity';
import PieChart, { PieChartData } from './PieChart';
import { UseTimelineResponse } from './useTimeline';

/**
 * Returns a string for the score chart tooltip.
 * @param entry The PieChartData entry to get the tooltip for.
 * @returns The string for the tooltip.
 */
function getScoreChartTooltip(entry?: PieChartData) {
    if (!entry) {
        return '';
    }
    const score = Math.round(entry.value * 100) / 100;
    if (entry.count) {
        return `${entry.name} - Count: ${entry.count}, Score: ${score}`;
    }
    return `${entry.name} - ${score}`;
}

/**
 * Returns a string for the time chart tooltip.
 * @param entry The PieChartData entry to get the tooltip for.
 * @returns The string for the tooltip.
 */
function getTimeChartTooltip(entry?: PieChartData) {
    if (!entry) {
        return '';
    }
    return `${entry.name} - ${getTimeDisplay(entry.value)}`;
}

/**
 * Converts a number of minutes to a display string in the format `1h 23m`.
 * @param value The time to display in minutes.
 * @returns The time as a display string.
 */
function getTimeDisplay(value: number) {
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    return `${hours}h ${minutes}m`;
}

interface ActivityPieChartProps {
    user: User;
    timeline: UseTimelineResponse;
}

const ActivityPieChart: React.FC<ActivityPieChartProps> = ({ user, timeline }) => {
    const [cohorts, setCohorts] = useState([ALL_COHORTS]);
    const [timeframe, setTimeframe] = useState(Timeframe.AllTime);
    const { requirements } = useRequirements(ALL_COHORTS, false);

    const [scoreChartCategory, setScoreChartCategory] = useState('');
    const [timeChartCategory, setTimeChartCategory] = useState('');

    const cohortOptions = useMemo(() => {
        if (!user.progress) {
            return [ALL_COHORTS, user.dojoCohort];
        }
        return [ALL_COHORTS].concat(
            Object.values(user.progress)
                .map((v) => Object.keys(v.minutesSpent ?? {}))
                .flat()
                .concat(user.dojoCohort)
                .sort(compareCohorts)
                .filter((item, pos, ary) => !pos || item !== ary[pos - 1]),
        );
    }, [user.progress, user.dojoCohort]);

    const scoreChartData = useMemo(() => {
        return getScoreChartData(
            user,
            cohorts,
            timeframe,
            timeline.entries,
            scoreChartCategory,
            requirements,
        );
    }, [user, cohorts, timeframe, timeline.entries, scoreChartCategory, requirements]);

    const timeChartData = useMemo(() => {
        return getTimeChartData(
            user,
            cohorts,
            timeframe,
            timeline.entries,
            timeChartCategory,
            requirements,
        );
    }, [user, cohorts, timeframe, timeline.entries, timeChartCategory, requirements]);

    const onChangeCohort = (newCohorts: string[]) => {
        setScoreChartCategory('');
        setTimeChartCategory('');

        const addedCohorts = newCohorts.filter((c) => !cohorts.includes(c));
        let finalCohorts = [];
        if (addedCohorts.includes(ALL_COHORTS)) {
            finalCohorts = [ALL_COHORTS];
        } else {
            finalCohorts = newCohorts.filter((c) => c !== ALL_COHORTS);
        }

        setCohorts(finalCohorts);
    };

    const onChangeTimeframe = (timeframe: Timeframe) => {
        setScoreChartCategory('');
        setTimeChartCategory('');
        setTimeframe(timeframe);
    };

    const onClickScoreChart = (_: any, segmentIndex: number) => {
        if (!scoreChartCategory) {
            setScoreChartCategory(scoreChartData[segmentIndex].name);
        }
    };

    const onClickTimeChart = (_: any, segmentIndex: number) => {
        if (!timeChartCategory) {
            setTimeChartCategory(timeChartData[segmentIndex].name);
        }
    };

    return (
        <Grid container columnSpacing={1} justifyContent='center'>
            <Grid item xs={12} sm={6}>
                <MultipleSelectChip
                    selected={cohorts}
                    setSelected={onChangeCohort}
                    options={cohortOptions.reduce(
                        (acc, curr) => {
                            acc[curr] = curr === ALL_COHORTS ? 'All Cohorts' : curr;
                            return acc;
                        },
                        {} as Record<string, string>,
                    )}
                    label='Cohorts'
                    sx={{ mb: 3, width: 1 }}
                    size='small'
                    error={cohorts.length === 0}
                />
            </Grid>

            <Grid item xs={12} sm={6}>
                <TextField
                    select
                    label='Timeframe'
                    value={timeframe}
                    onChange={(event) =>
                        onChangeTimeframe(event.target.value as Timeframe)
                    }
                    sx={{ mb: 3, height: 1 }}
                    fullWidth
                >
                    {Object.values(Timeframe).map((option) => (
                        <MenuItem key={option} value={option}>
                            {displayTimeframe(option)}
                        </MenuItem>
                    ))}
                </TextField>
            </Grid>

            <Grid item xs={12}>
                <Typography variant='body2' color='text.secondary' textAlign='center'>
                    Click on a segment of the pie chart to see more details
                </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={6} mt={4}>
                <PieChart
                    id='score-chart'
                    title={`Score Breakdown${
                        scoreChartCategory && `: ${scoreChartCategory}`
                    }`}
                    data={scoreChartData}
                    renderTotal={(score) => (
                        <Stack alignItems='center'>
                            <Typography variant='subtitle1'>
                                Total {scoreChartCategory ? 'Category' : 'Cohort'} Score:{' '}
                                {Math.round(score * 100) / 100}
                            </Typography>
                            {scoreChartCategory && (
                                <Button onClick={() => setScoreChartCategory('')}>
                                    Back to Cohort
                                </Button>
                            )}
                        </Stack>
                    )}
                    getTooltip={getScoreChartTooltip}
                    onClick={onClickScoreChart}
                />
            </Grid>

            <Grid item xs={12} sm={6} md={6} mt={4}>
                <PieChart
                    id='time-chart'
                    title={`Time Breakdown${
                        timeChartCategory && `: ${timeChartCategory}`
                    }`}
                    data={timeChartData}
                    renderTotal={(time) => (
                        <Stack alignItems='center'>
                            <Typography variant='subtitle1'>
                                Total {timeChartCategory ? 'Category' : 'Cohort'} Time:{' '}
                                {getTimeDisplay(time)}
                            </Typography>
                            {timeChartCategory && (
                                <Button onClick={() => setTimeChartCategory('')}>
                                    Back to Cohort
                                </Button>
                            )}
                        </Stack>
                    )}
                    getTooltip={getTimeChartTooltip}
                    onClick={onClickTimeChart}
                />
            </Grid>
        </Grid>
    );
};

export default ActivityPieChart;
