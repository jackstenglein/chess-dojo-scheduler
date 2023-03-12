import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Stack, Typography, Card, CardHeader, CardContent, Divider } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Carousel from 'react-material-ui-carousel';

import GraduationIcon from '../../scoreboard/GraduationIcon';
import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { Graduation } from '../../database/graduation';

interface GraduationCardProps {
    graduation: Graduation;
}

const GraduationCard: React.FC<GraduationCardProps> = ({ graduation }) => {
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
                    <Stack direction='row' alignItems='start'>
                        <Typography variant='h6'>{graduation.previousCohort}</Typography>
                        <ArrowForwardIcon sx={{ position: 'relative', top: '2px' }} />
                        <Typography variant='h6'>{graduation.newCohort}</Typography>
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
                <Typography>No graduations in the past month</Typography>
            ) : (
                <Carousel
                    sx={{ overflow: 'visible', px: '60px' }}
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
