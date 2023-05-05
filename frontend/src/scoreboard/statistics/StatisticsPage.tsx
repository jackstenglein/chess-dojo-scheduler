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
        if (!request.data) {
            return [];
        }
        return [
            {
                label: 'Active',
                data: dojoCohorts.map((c) => ({
                    cohort: c,
                    value: request.data!.activeParticipants[c],
                })),
            },
            {
                label: 'Inactive',
                data: dojoCohorts.map((c) => ({
                    cohort: c,
                    value:
                        request.data!.participants[c] -
                        request.data!.activeParticipants[c],
                })),
            },
        ];
    }, [request.data]);

    const ratingSystemsData: Series[] = useMemo(() => {
        if (!request.data) {
            return [];
        }
        return Object.values(RatingSystem).map((rs) => ({
            label: formatRatingSystem(rs),
            data: dojoCohorts.map((c) => ({
                cohort: c,
                value: request.data!.ratingSystems[c][rs],
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
