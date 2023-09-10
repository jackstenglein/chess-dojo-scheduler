import { useState, useMemo } from 'react';
import { Stack, TextField, MenuItem, Typography, Button, Grid } from '@mui/material';

import { compareCohorts, User } from '../../database/user';
import { useRequirements } from '../../api/cache/requirements';
import PieChart, { PieChartData } from './PieChart';
import {
    Timeframe,
    displayTimeframe,
    getScoreChartData,
    getTimeChartData,
} from './activity';
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
    const [cohort, setCohort] = useState(user.dojoCohort);
    const [timeframe, setTimeframe] = useState(Timeframe.AllTime);
    const { requirements } = useRequirements(cohort, false);

    const [scoreChartCategory, setScoreChartCategory] = useState('');
    const [timeChartCategory, setTimeChartCategory] = useState('');

    const cohortOptions = useMemo(() => {
        if (!user.progress) {
            return [user.dojoCohort];
        }
        return Object.values(user.progress)
            .map((v) => Object.keys(v.minutesSpent ?? {}))
            .flat()
            .concat(user.dojoCohort)
            .sort(compareCohorts)
            .filter((item, pos, ary) => !pos || item !== ary[pos - 1]);
    }, [user.progress, user.dojoCohort]);

    const scoreChartData = useMemo(() => {
        return getScoreChartData(
            user,
            cohort,
            timeframe,
            timeline.entries,
            scoreChartCategory,
            requirements
        );
    }, [user, cohort, timeframe, timeline.entries, scoreChartCategory, requirements]);

    const timeChartData = useMemo(() => {
        return getTimeChartData(
            user,
            cohort,
            timeframe,
            timeline.entries,
            timeChartCategory,
            requirements
        );
    }, [user, cohort, timeframe, timeline.entries, timeChartCategory, requirements]);

    const onChangeCohort = (cohort: string) => {
        setScoreChartCategory('');
        setTimeChartCategory('');
        setCohort(cohort);
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
            </Grid>

            <Grid item xs={12} sm={6}>
                <TextField
                    select
                    label='Timeframe'
                    value={timeframe}
                    onChange={(event) =>
                        onChangeTimeframe(event.target.value as Timeframe)
                    }
                    sx={{ mb: 3 }}
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
