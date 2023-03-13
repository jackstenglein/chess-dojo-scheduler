import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Button, Chip, Container, Stack, Typography } from '@mui/material';
import Carousel from 'react-material-ui-carousel';
import CheckIcon from '@mui/icons-material/Check';

import { useApi } from '../api/Api';
import { useRequest } from '../api/Request';
import { useAuth } from '../auth/Auth';
import { Requirement, ScoreboardDisplay } from '../database/requirement';
import { ALL_COHORTS, compareCohorts, dojoCohorts } from '../database/user';
import LoadingPage from '../loading/LoadingPage';
import NotFoundPage from '../NotFoundPage';
import ProgressUpdateDialog from '../profile/progress/ProgressUpdateDialog';
import Position from './Position';

type RequirementPageProps = {
    id: string;
};

const RequirementPage = () => {
    const { id } = useParams<RequirementPageProps>();
    const api = useApi();
    const request = useRequest<Requirement>();
    const user = useAuth().user!;
    const [showUpdateDialog, setShowUpdateDialog] = useState(false);

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.getRequirement(id!)
                .then((response) => {
                    request.onSuccess(response.data);
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [api, id, request]);

    const requirement = request.data;

    const cohort = useMemo(() => {
        if (!requirement) {
            return user.dojoCohort;
        }
        const cohortOptions = requirement.counts.ALL_COHORTS
            ? dojoCohorts
            : Object.keys(requirement.counts).sort(compareCohorts);
        return cohortOptions.includes(user.dojoCohort)
            ? user.dojoCohort
            : cohortOptions[0];
    }, [requirement, user.dojoCohort]);

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    if (!requirement) {
        return <NotFoundPage />;
    }

    const progress = user.progress[requirement.id];

    const isSlider =
        requirement.scoreboardDisplay === ScoreboardDisplay.ProgressBar ||
        requirement.scoreboardDisplay === ScoreboardDisplay.Unspecified;

    const totalCount = requirement.counts[cohort] || requirement.counts[ALL_COHORTS];
    const currentCount = progress?.counts[cohort] || progress?.counts[ALL_COHORTS] || 0;
    const isComplete = currentCount >= totalCount;

    console.log(requirement);
    console.log(progress);

    return (
        <Container maxWidth='md' sx={{ pt: 6, pb: 4 }}>
            <Stack spacing={3}>
                <Stack direction='row' justifyContent='space-between' alignItems='center'>
                    <Stack>
                        <Typography variant='h4'>{requirement.name}</Typography>
                        <Typography variant='h5' color='text.secondary'>
                            {requirement.category}
                        </Typography>
                    </Stack>
                    {isComplete ? (
                        <Chip icon={<CheckIcon />} label='Completed' color='success' />
                    ) : (
                        <Button
                            variant='contained'
                            onClick={() => setShowUpdateDialog(true)}
                        >
                            {isSlider ? 'Update Progress' : 'Mark Complete'}
                        </Button>
                    )}
                </Stack>

                <Typography variant='body1' sx={{ whiteSpace: 'pre-line', mt: 3 }}>
                    {requirement.description}
                </Typography>

                {requirement.positionUrls?.length === 1 && (
                    <Position url={requirement.positionUrls[0]} />
                )}

                {requirement.positionUrls && requirement.positionUrls.length > 1 && (
                    <Carousel autoPlay={false} navButtonsAlwaysVisible>
                        {requirement.positionUrls.map((url, idx) => (
                            <Position key={url} url={url} title={`Position ${idx + 1}`} />
                        ))}
                    </Carousel>
                )}

                {requirement.videoUrls.map((url, idx) => (
                    <Box sx={{ mt: 3, width: 1, aspectRatio: '1.77' }} key={url}>
                        <iframe
                            src={url}
                            title={`${requirement.name} Video ${idx + 1}`}
                            allow='accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share'
                            allowFullScreen={true}
                            style={{ width: '100%', height: '100%' }}
                            frameBorder={0}
                        />
                    </Box>
                ))}
            </Stack>

            <ProgressUpdateDialog
                open={showUpdateDialog}
                onClose={() => setShowUpdateDialog(false)}
                requirement={requirement}
                cohort={user.dojoCohort}
                progress={progress}
                selectCohort
            />
        </Container>
    );
};

export default RequirementPage;
