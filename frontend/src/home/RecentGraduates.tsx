import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Stack, Typography, Card, CardHeader, CardContent, Divider } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Carousel from 'react-material-ui-carousel';

import GraduationIcon from '../scoreboard/GraduationIcon';
import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { Graduation } from '../database/graduation';
import LoadingPage from '../loading/LoadingPage';

interface GraduationCardProps {
    graduation: Graduation;
}

const GraduationCard: React.FC<GraduationCardProps> = ({ graduation }) => {
    const startDate = new Date(graduation.startedAt).toLocaleDateString();
    const endDate = new Date(graduation.createdAt).toLocaleDateString();

    return (
        <Card variant='outlined'>
            <CardHeader
                title={
                    <Stack direction='row' spacing={2}>
                        <Link to={`/profile/${graduation.username}`}>
                            <Typography variant='h4'>
                                {graduation.discordUsername}
                            </Typography>
                        </Link>
                        <GraduationIcon cohort={graduation.previousCohort} />
                    </Stack>
                }
                subheader={
                    <Stack>
                        <Stack direction='row' alignItems='start'>
                            <Typography variant='h5'>
                                {graduation.previousCohort}
                            </Typography>
                            <ArrowForwardIcon sx={{ position: 'relative', top: '2px' }} />
                            <Typography variant='h5'>{graduation.newCohort}</Typography>
                        </Stack>
                        <Stack direction='row' alignItems='start'>
                            <Typography variant='h6'>
                                {graduation.startedAt ? startDate : '??'}
                            </Typography>
                            <ArrowForwardIcon sx={{ position: 'relative', top: '2px' }} />
                            <Typography variant='h6'>{endDate}</Typography>
                        </Stack>
                    </Stack>
                }
            />
            {graduation.comments && (
                <CardContent>
                    <Typography sx={{ whiteSpace: 'pre-line' }}>
                        "{graduation.comments}"{`\n- ${graduation.discordUsername}`}
                    </Typography>
                </CardContent>
            )}
        </Card>
    );
};

const RecentGraduates = () => {
    const api = useApi();
    const request = useRequest<Graduation[]>();

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.listGraduationsByDate()
                .then((graduations) => request.onSuccess(graduations))
                .catch((err) => {
                    console.error('listGraduationsByDate: ', err);
                    request.onFailure(err);
                });
        }
    }, [request, api]);

    const graduations = request.data ?? [];

    return (
        <Stack spacing={3}>
            <RequestSnackbar request={request} />
            <Stack>
                <Typography variant='h6'>Recent Graduates</Typography>
                <Divider />
            </Stack>

            {graduations.length === 0 ? (
                request.isLoading() ? (
                    <LoadingPage />
                ) : (
                    <Typography>No graduations in the past month</Typography>
                )
            ) : (
                <Carousel
                    sx={{ overflow: 'visible', px: '70px' }}
                    navButtonsAlwaysVisible
                    autoPlay={false}
                >
                    {graduations.map((g) => (
                        <GraduationCard key={g.createdAt} graduation={g} />
                    ))}
                </Carousel>
            )}
        </Stack>
    );
};

export default RecentGraduates;
