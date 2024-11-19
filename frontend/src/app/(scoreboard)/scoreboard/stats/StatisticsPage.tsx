'use client';

import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { useAuth } from '@/auth/Auth';
import ScoreboardViewSelector from '@/components/scoreboard/ScoreboardViewSelector';
import { UserStatistics } from '@/database/statistics';
import { RatingSystem, dojoCohorts, formatRatingSystem } from '@/database/user';
import LoadingPage from '@/loading/LoadingPage';
import Chart, { Datum, Series } from '@/scoreboard/statistics/Chart';
import { Container, Stack } from '@mui/material';
import { useEffect, useMemo } from 'react';
import { AxisOptions } from 'react-charts';

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

export function formatTime(value: number) {
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
    label: string,
    data: UserStatistics | undefined,
    getValue: (d: UserStatistics, c: string) => number,
): Series[] {
    if (!data) {
        return [];
    }

    return [
        {
            label: label,
            data: dojoCohorts.map((c) => {
                const result = getValue(data, c);
                return {
                    cohort: c,
                    value: isFinite(result) ? result : 0,
                };
            }),
        },
    ];
}

function getAdminParticipantsSeries(data: UserStatistics | undefined): Series[] {
    if (!data) {
        return [];
    }

    return [
        {
            label: 'Active',
            data: dojoCohorts.map((c) => {
                const result = data.cohorts[c].activeParticipants || 0;
                return {
                    cohort: c,
                    value: isFinite(result) ? result : 0,
                };
            }),
        },
        {
            label: 'Inactive',
            data: dojoCohorts.map((c) => {
                const result = data.cohorts[c].inactiveParticipants || 0;
                return {
                    cohort: c,
                    value: isFinite(result) ? result : 0,
                };
            }),
        },
        {
            label: 'Free Active',
            data: dojoCohorts.map((c) => {
                const result = data.cohorts[c].freeActiveParticipants || 0;
                return {
                    cohort: c,
                    value: isFinite(result) ? result : 0,
                };
            }),
        },
        {
            label: 'Free Inactive',
            data: dojoCohorts.map((c) => {
                const result = data.cohorts[c].freeInactiveParticipants || 0;
                return {
                    cohort: c,
                    value: isFinite(result) ? result : 0,
                };
            }),
        },
    ];
}

export function StatisticsPage() {
    const api = useApi();
    const request = useRequest<UserStatistics>();
    const { user } = useAuth();

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.getUserStatistics()
                .then((response) => {
                    request.onSuccess(response.data);
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [request, api]);

    const totalRatingChangeData: Series[] = useMemo(() => {
        return getSeries(
            'Rating Change',
            request.data,
            (d, c) =>
                d.cohorts[c].activeRatingChanges + d.cohorts[c].inactiveRatingChanges,
        );
    }, [request.data]);

    const avgRatingChangeData: Series[] = useMemo(() => {
        return getSeries(
            'Average Rating Change',
            request.data,
            (d, c) =>
                (d.cohorts[c].activeRatingChanges + d.cohorts[c].inactiveRatingChanges) /
                (d.cohorts[c].activeParticipants + d.cohorts[c].inactiveParticipants),
        );
    }, [request.data]);

    const totalTimeData: Series[] = useMemo(() => {
        return getSeries(
            'Total Time',
            request.data,
            (d, c) => d.cohorts[c].activeMinutesSpent + d.cohorts[c].inactiveMinutesSpent,
        );
    }, [request.data]);

    const avgTimeData: Series[] = useMemo(() => {
        return getSeries(
            'Average Time',
            request.data,
            (d, c) =>
                (d.cohorts[c].activeMinutesSpent + d.cohorts[c].inactiveMinutesSpent) /
                (d.cohorts[c].activeParticipants + d.cohorts[c].inactiveParticipants),
        );
    }, [request.data]);

    const avgRatingChangePerHourData: Series[] = useMemo(() => {
        return getSeries(
            'Average Rating Change Per Hour',
            request.data,
            (d, c) =>
                (d.cohorts[c].activeRatingChangePerHour +
                    d.cohorts[c].inactiveRatingChangePerHour) /
                (d.cohorts[c].activeParticipants + d.cohorts[c].inactiveParticipants),
        );
    }, [request.data]);

    const numGraduationsData: Series[] = useMemo(() => {
        return getSeries(
            'Graduations',
            request.data,
            (d, c) => d.cohorts[c].numGraduations,
        );
    }, [request.data]);

    const graduationTimeData: Series[] = useMemo(() => {
        return getSeries(
            'Average Time to Graduate',
            request.data,
            (d, c) => d.cohorts[c].graduationMinutes / d.cohorts[c].numGraduations,
        );
    }, [request.data]);

    const totalDojoScoreData: Series[] = useMemo(() => {
        return getSeries(
            'Total Dojo Score',
            request.data,
            (d, c) => d.cohorts[c].activeDojoScores + d.cohorts[c].inactiveDojoScores,
        );
    }, [request.data]);

    const avgDojoScoreData: Series[] = useMemo(() => {
        return getSeries(
            'Average Dojo Score',
            request.data,
            (d, c) =>
                (d.cohorts[c].activeDojoScores + d.cohorts[c].inactiveDojoScores) /
                (d.cohorts[c].activeParticipants + d.cohorts[c].inactiveParticipants),
        );
    }, [request.data]);

    const avgRatingChangePerDojoScoreData: Series[] = useMemo(() => {
        return getSeries(
            'Avg Rating Change / Dojo Point',
            request.data,
            (d, c) => d.cohorts[c].avgRatingChangePerDojoPoint,
        );
    }, [request.data]);

    const participantsData: Series[] = useMemo(() => {
        return user?.isAdmin
            ? getAdminParticipantsSeries(request.data)
            : getSeries(
                  'Participants',
                  request.data,
                  (d, c) =>
                      d.cohorts[c].activeParticipants +
                      d.cohorts[c].inactiveParticipants +
                      d.cohorts[c].freeActiveParticipants +
                      d.cohorts[c].freeInactiveParticipants,
              );
    }, [request.data, user?.isAdmin]);

    const ratingSystemsData: Series[] = useMemo(() => {
        const data = request.data;
        if (!data) {
            return [];
        }
        return Object.values(RatingSystem).map((rs) => ({
            label: formatRatingSystem(rs),
            data: dojoCohorts.map((c) => ({
                cohort: c,
                value:
                    data.cohorts[c].activeRatingSystems[rs] +
                    data.cohorts[c].inactiveRatingSystems[rs],
            })),
        }));
    }, [request.data]);

    const subscriptionChangesData: Series[] = useMemo(() => {
        if (!request.data || !user?.isAdmin) {
            return [];
        }
        return [
            {
                label: 'Free -> Subscribed',
                data: dojoCohorts.map((c) => {
                    const result = request.data?.cohorts[c].freeTierConversions || 0;
                    return {
                        cohort: c,
                        value: isFinite(result) ? result : 0,
                    };
                }),
            },
            {
                label: 'Subscribed -> Free',
                data: dojoCohorts.map((c) => {
                    const result = request.data?.cohorts[c].subscriptionCancelations || 0;
                    return {
                        cohort: c,
                        value: isFinite(result) ? result : 0,
                    };
                }),
            },
        ];
    }, [request.data, user?.isAdmin]);

    if (request.isLoading() && request.data === undefined) {
        return <LoadingPage />;
    }

    if (!request.data) {
        return <Container></Container>;
    }

    const totalRatingChange = totalRatingChangeData[0]?.data.reduce(
        (sum, d) => sum + d.value,
        0,
    );
    const totalDojoPoints = totalDojoScoreData[0]?.data.reduce(
        (sum, d) => sum + d.value,
        0,
    );

    return (
        <Container maxWidth='xl' sx={{ pt: 4, pb: 4 }}>
            <RequestSnackbar request={request} />

            <ScoreboardViewSelector value='stats' />

            <Stack spacing={3}>
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
                    title='Average Rating Change Per Hour'
                    series={avgRatingChangePerHourData}
                    primaryAxis={primaryAxis}
                    secondaryAxes={decimalSecondaryAxes}
                    hideSums
                />

                <Chart
                    title='Number of Graduations'
                    series={numGraduationsData}
                    primaryAxis={primaryAxis}
                    secondaryAxes={participantsSecondaryAxes}
                />

                <Chart
                    title='Average Time to Graduate'
                    series={graduationTimeData}
                    primaryAxis={primaryAxis}
                    secondaryAxes={timeSecondaryAxes}
                    hideSums
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
                    title='Average Rating Change Per Dojo Point'
                    series={avgRatingChangePerDojoScoreData}
                    primaryAxis={primaryAxis}
                    secondaryAxes={decimalSecondaryAxes}
                    sumFormatter={() =>
                        `${Math.round((100 * totalRatingChange) / totalDojoPoints) / 100}`
                    }
                />

                <Chart
                    title='Participants'
                    series={participantsData}
                    primaryAxis={primaryAxis}
                    secondaryAxes={participantsSecondaryAxes}
                />

                {user?.isAdmin && (
                    <Chart
                        title='Subscription Changes'
                        series={subscriptionChangesData}
                        primaryAxis={primaryAxis}
                        secondaryAxes={participantsSecondaryAxes}
                    />
                )}

                <Chart
                    title='Rating Systems'
                    series={ratingSystemsData}
                    primaryAxis={primaryAxis}
                    secondaryAxes={ratingSystemsSecondaryAxes}
                />
            </Stack>
        </Container>
    );
}
