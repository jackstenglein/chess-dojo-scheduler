import { useEffect } from 'react';
import { CircularProgress, Stack } from '@mui/material';

import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { GetStatisticsResponse } from '../api/adminApi';
import AvailabilityStatisticsTable from './AvailabilitiyStatisticsTable';
import MeetingStatisticsTable from './MeetingStatisticsTable';
import GroupStatisticsTable from './GroupStatisticsTable';

const StatisticsTab = () => {
    const api = useApi();
    const request = useRequest<GetStatisticsResponse>();

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.adminGetStatistics()
                .then((response) => {
                    request.onSuccess(response.data);
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [request, api]);

    if (!request.isSent() || request.isLoading()) {
        return <CircularProgress />;
    }

    if (!request.data) {
        return (
            <Stack>
                <RequestSnackbar request={request} />
            </Stack>
        );
    }

    const availabilityStats = request.data.availabilityStatistics;
    const meetingStats = request.data.meetingStatistics;
    return (
        <Stack spacing={6}>
            <RequestSnackbar request={request} />

            <AvailabilityStatisticsTable stats={availabilityStats} />
            <MeetingStatisticsTable stats={meetingStats} />
            <GroupStatisticsTable
                availabilityStats={availabilityStats}
                meetingStats={meetingStats}
            />
        </Stack>
    );
};

export default StatisticsTab;
