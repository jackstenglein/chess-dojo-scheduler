import { useEffect } from 'react';
import { Container, MenuItem, Stack, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { RequestSnackbar, useRequest } from '../../api/Request';
import { dojoCohorts } from '../../database/user';
import { useApi } from '../../api/Api';
import { UserStatistics } from '../../database/statistics';
import LoadingPage from '../../loading/LoadingPage';
import ParticipantsChart from './ParticipantsChart';
import RatingSystemsChart from './RatingSystemsChart';

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
                <ParticipantsChart stats={request.data} />
                <RatingSystemsChart stats={request.data} />
            </Stack>
        </Container>
    );
};

export default StatisticsPage;
