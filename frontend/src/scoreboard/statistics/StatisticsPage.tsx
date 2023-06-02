import { useEffect, useMemo } from 'react';
import { Container, MenuItem, Stack, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AxisOptions } from 'react-charts';

import { RequestSnackbar, useRequest } from '../../api/Request';
import { RatingSystem, dojoCohorts, formatRatingSystem } from '../../database/user';
import { useApi } from '../../api/Api';
import { UserStatistics } from '../../database/statistics';
import LoadingPage from '../../loading/LoadingPage';
import Chart, { Datum, Series } from './Chart';

const primaryAxis: AxisOptions<Datum> = {
    getValue: (datum) => datum.cohort,
};
const participantsSecondaryAxes: AxisOptions<Datum>[] = [
    {
        scaleType: 'linear',
        getValue: (datum) => datum.value,
        stacked: true,
        formatters: {
            scale: (value) => (value % 1 === 0 ? `${value}` : ''),
        },
    },
];
const ratingSystemsSecondaryAxes: AxisOptions<Datum>[] = [
    {
        scaleType: 'linear',
        getValue: (datum) => datum.value,
        formatters: {
            scale: (value) => (value % 1 === 0 ? `${value}` : ''),
        },
    },
];
const decimalSecondaryAxes: AxisOptions<Datum>[] = [
    {
        scaleType: 'linear',
        getValue: (datum) => datum.value,
    },
];

function formatTime(value: number) {
    const hours = Math.floor(value / 60);
    const minutes = Math.round(value % 60);
    if (minutes === 0 && hours > 0) {
        return `${hours}h`;
    }
    return `${hours}h ${minutes}m`;
}

const timeSecondaryAxes: AxisOptions<Datum>[] = [
    {
        scaleType: 'linear',
        getValue: (datum) => datum.value,
        formatters: {
            scale: formatTime,
        },
    },
];

function getSeries(
    data: UserStatistics | undefined,
    getActiveValue: (d: UserStatistics, c: string) => number,
    getInactiveValue: (d: UserStatistics, c: string) => number
): Series[] {
    if (!data) {
        return [];
    }

    return [
        {
            label: 'Active',
            data: dojoCohorts.map((c) => {
                const result = getActiveValue(data, c);
                return {
                    cohort: c,
                    value: isFinite(result) ? result : 0,
                };
            }),
        },
        {
            label: 'Inactive',
            data: dojoCohorts.map((c) => {
                const result = getInactiveValue(data, c);
                return {
                    cohort: c,
                    value: isFinite(result) ? result : 0,
                };
            }),
        },
    ];
}

const StatisticsPage = () => {
    const api = useApi();
    const navigate = useNavigate();
    const request = useRequest<UserStatistics>();

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.getUserStatistics()
                .then((response) => {
                    console.log('getUserStatistics: ', response);
                    request.onSuccess(response.data);
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [request, api]);

    const participantsData: Series[] = useMemo(() => {
        return getSeries(
            request.data,
            (d, c) => d.cohorts[c].activeParticipants,
            (d, c) => d.cohorts[c].inactiveParticipants
        );
    }, [request.data]);

    const totalDojoScoreData: Series[] = useMemo(() => {
        return getSeries(
            request.data,
            (d, c) => d.cohorts[c].activeDojoScores,
            (d, c) => d.cohorts[c].inactiveDojoScores
        );
    }, [request.data]);

    const avgDojoScoreData: Series[] = useMemo(() => {
        return getSeries(
            request.data,
            (d, c) => d.cohorts[c].activeDojoScores / d.cohorts[c].activeParticipants,
            (d, c) => d.cohorts[c].inactiveDojoScores / d.cohorts[c].inactiveParticipants
        );
    }, [request.data]);

    const totalRatingChangeData: Series[] = useMemo(() => {
        return getSeries(
            request.data,
            (d, c) => d.cohorts[c].activeRatingChanges,
            (d, c) => d.cohorts[c].inactiveRatingChanges
        );
    }, [request.data]);

    const avgRatingChangeData: Series[] = useMemo(() => {
        return getSeries(
            request.data,
            (d, c) => d.cohorts[c].activeRatingChanges / d.cohorts[c].activeParticipants,
            (d, c) =>
                d.cohorts[c].inactiveRatingChanges / d.cohorts[c].inactiveParticipants
        );
    }, [request.data]);

    const totalTimeData: Series[] = useMemo(() => {
        return getSeries(
            request.data,
            (d, c) => d.cohorts[c].activeMinutesSpent,
            (d, c) => d.cohorts[c].inactiveMinutesSpent
        );
    }, [request.data]);

    const avgTimeData: Series[] = useMemo(() => {
        return getSeries(
            request.data,
            (d, c) => d.cohorts[c].activeMinutesSpent / d.cohorts[c].activeParticipants,
            (d, c) =>
                d.cohorts[c].inactiveMinutesSpent / d.cohorts[c].inactiveParticipants
        );
    }, [request.data]);

    const ratingSystemsData: Series[] = useMemo(() => {
        if (!request.data) {
            return [];
        }
        return Object.values(RatingSystem).map((rs) => ({
            label: formatRatingSystem(rs),
            data: dojoCohorts.map((c) => ({
                cohort: c,
                value:
                    request.data!.cohorts[c].activeRatingSystems[rs] +
                    request.data!.cohorts[c].inactiveRatingSystems[rs],
            })),
        }));
    }, [request.data]);

    if (request.isLoading() && request.data === undefined) {
        return <LoadingPage />;
    }

    if (!request.data) {
        return <Container></Container>;
    }

    const onChangeCohort = (cohort: string) => {
        navigate(`../${cohort}`);
    };

    return (
        <Container maxWidth='xl' sx={{ pt: 4, pb: 4 }}>
            <RequestSnackbar request={request} />

            <TextField
                select
                label='Cohort'
                value='stats'
                onChange={(event) => onChangeCohort(event.target.value)}
                sx={{ mb: 3 }}
                fullWidth
            >
                <MenuItem value='stats'>Statistics</MenuItem>
                {dojoCohorts.map((option) => (
                    <MenuItem key={option} value={option}>
                        {option}
                    </MenuItem>
                ))}
            </TextField>

            <Stack spacing={3}>
                <Chart
                    title='Participants'
                    series={participantsData}
                    primaryAxis={primaryAxis}
                    secondaryAxes={participantsSecondaryAxes}
                />

                <Chart
                    title='Total Dojo Score'
                    series={totalDojoScoreData}
                    primaryAxis={primaryAxis}
                    secondaryAxes={decimalSecondaryAxes}
                    sumFormatter={(sum) => `${Math.round(sum)}`}
                />
                <Chart
                    title='Average Dojo Score'
                    series={avgDojoScoreData}
                    primaryAxis={primaryAxis}
                    secondaryAxes={decimalSecondaryAxes}
                    hideSums
                />

                <Chart
                    title='Total Rating Change'
                    series={totalRatingChangeData}
                    primaryAxis={primaryAxis}
                    secondaryAxes={decimalSecondaryAxes}
                />
                <Chart
                    title='Average Rating Change'
                    series={avgRatingChangeData}
                    primaryAxis={primaryAxis}
                    secondaryAxes={decimalSecondaryAxes}
                    hideSums
                />

                <Chart
                    title='Total Time Spent'
                    series={totalTimeData}
                    primaryAxis={primaryAxis}
                    secondaryAxes={timeSecondaryAxes}
                    sumFormatter={formatTime}
                />
                <Chart
                    title='Average Time Spent'
                    series={avgTimeData}
                    primaryAxis={primaryAxis}
                    secondaryAxes={timeSecondaryAxes}
                    hideSums
                />

                <Chart
                    title='Rating Systems'
                    series={ratingSystemsData}
                    primaryAxis={primaryAxis}
                    secondaryAxes={ratingSystemsSecondaryAxes}
                />
            </Stack>
        </Container>
    );
};

export default StatisticsPage;
