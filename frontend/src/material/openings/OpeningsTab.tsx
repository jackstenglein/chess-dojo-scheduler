import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Stack, Typography } from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

import { RequestSnackbar, useRequest } from '../../api/Request';
import { useApi } from '../../api/Api';
import { Opening } from '../../database/opening';
import LoadingPage from '../../loading/LoadingPage';

const OpeningsTab = () => {
    const request = useRequest<Opening[]>();
    const api = useApi();

    useEffect(() => {
        if (!request.isSent()) {
            api.listOpenings()
                .then((openings) => {
                    request.onSuccess(openings);
                    console.log('listOpenings: ', openings);
                })
                .catch((err) => {
                    console.error('listOpenings: ', err);
                    request.onFailure(err);
                });
        }
    });

    if (request.isLoading()) {
        return <LoadingPage />;
    }

    return (
        <Stack spacing={4}>
            <RequestSnackbar request={request} />

            {request.data?.map((opening) => (
                <Stack key={opening.name} spacing={0.5}>
                    <Typography variant='h5'>{opening.name}</Typography>

                    <Stack spacing={1} pl={3}>
                        {opening.levels.map((level) => (
                            <Link
                                to={`/openings/${opening.id}/${level.name}`}
                                style={{ textDecoration: 'none' }}
                            >
                                <Stack direction='row' alignItems='center' spacing={2}>
                                    <Typography
                                        key={level.name}
                                        variant='h6'
                                        color='text.secondary'
                                        sx={{ textDecoration: 'none' }}
                                    >
                                        {level.name} ({level.cohortRange})
                                    </Typography>

                                    <ArrowForwardIosIcon htmlColor='rgba(0, 0, 0, 0.6)' />
                                </Stack>
                            </Link>
                        ))}

                        <Typography
                            variant='h6'
                            color='text.secondary'
                            sx={{ textDecoration: 'none' }}
                        >
                            Additional Cohorts Coming Soon
                        </Typography>
                    </Stack>
                </Stack>
            ))}

            {(request.data === undefined || request.data.length === 0) && (
                <Typography>No openings found</Typography>
            )}
        </Stack>
    );
};

export default OpeningsTab;
