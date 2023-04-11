import { Stack, Typography, Chip, Button, Box } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useMemo, useState } from 'react';
import Carousel from 'react-material-ui-carousel';
import { useAuth } from '../auth/Auth';

import { Requirement, ScoreboardDisplay } from '../database/requirement';
import { ALL_COHORTS, compareCohorts, dojoCohorts } from '../database/user';
import ProgressUpdateDialog from '../profile/progress/ProgressUpdateDialog';
import Position from './Position';
import { useNavigate } from 'react-router-dom';

interface RequirementDisplayProps {
    requirement: Requirement;
    preview?: boolean;
}

const RequirementDisplay: React.FC<RequirementDisplayProps> = ({
    requirement,
    preview,
}) => {
    const user = useAuth().user!;
    const [showUpdateDialog, setShowUpdateDialog] = useState(false);
    const navigate = useNavigate();

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

    const progress = user.progress[requirement.id];

    const isSlider =
        requirement.scoreboardDisplay === ScoreboardDisplay.ProgressBar ||
        requirement.scoreboardDisplay === ScoreboardDisplay.Unspecified;

    const totalCount = requirement.counts[cohort] || requirement.counts[ALL_COHORTS];
    const currentCount = progress?.counts[cohort] || progress?.counts[ALL_COHORTS] || 0;
    const isComplete = currentCount >= totalCount;

    let requirementName = requirement.name;
    if (requirement.scoreboardDisplay === ScoreboardDisplay.Checkbox && totalCount > 1) {
        requirementName += ` (${totalCount})`;
    }

    return (
        <>
            <Stack spacing={3}>
                <Stack direction='row' justifyContent='space-between' alignItems='center'>
                    <Stack>
                        <Typography variant='h4'>{requirementName}</Typography>
                        <Typography variant='h5' color='text.secondary'>
                            {requirement.category}
                        </Typography>
                    </Stack>
                    {!preview && (
                        <Stack direction='row' spacing={2}>
                            {isComplete && (
                                <Chip
                                    icon={<CheckIcon />}
                                    label='Completed'
                                    color='success'
                                />
                            )}
                            {!isComplete && (
                                <Button
                                    variant='contained'
                                    onClick={() => setShowUpdateDialog(true)}
                                >
                                    {isSlider ? 'Update Progress' : 'Mark Complete'}
                                </Button>
                            )}
                            {user.isAdmin && (
                                <Button
                                    variant='contained'
                                    onClick={() => navigate('edit')}
                                >
                                    Edit Requirement
                                </Button>
                            )}
                        </Stack>
                    )}
                </Stack>

                <Typography
                    variant='body1'
                    sx={{ whiteSpace: 'pre-line', mt: 3 }}
                    dangerouslySetInnerHTML={{ __html: requirement.description }}
                />

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

                {requirement.videoUrls &&
                    requirement.videoUrls.map((url, idx) => (
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

            {!preview && (
                <ProgressUpdateDialog
                    open={showUpdateDialog}
                    onClose={() => setShowUpdateDialog(false)}
                    requirement={requirement}
                    cohort={user.dojoCohort}
                    progress={progress}
                    selectCohort
                />
            )}
        </>
    );
};

export default RequirementDisplay;
