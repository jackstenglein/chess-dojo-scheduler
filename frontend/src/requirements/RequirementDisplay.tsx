import { Stack, Typography, Chip, Button, Box, Grid } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useMemo, useState } from 'react';
import { useAuth } from '../auth/Auth';

import {
    CustomTask,
    Requirement,
    ScoreboardDisplay,
    isRequirement,
} from '../database/requirement';
import { ALL_COHORTS, compareCohorts, dojoCohorts } from '../database/user';
import ProgressDialog from '../profile/progress/ProgressDialog';
import Position from './Position';
import CustomTaskDisplay from './CustomTaskDisplay';

interface RequirementDisplayProps {
    requirement: Requirement | CustomTask;
    onClose?: () => void;
}

const RequirementDisplay: React.FC<RequirementDisplayProps> = ({
    requirement,
    onClose,
}) => {
    const user = useAuth().user!;
    const [showUpdateDialog, setShowUpdateDialog] = useState(false);

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

    if (!isRequirement(requirement)) {
        return <CustomTaskDisplay task={requirement} onClose={onClose} />;
    }

    const progress = user.progress[requirement.id];

    const totalCount = requirement.counts[cohort] || requirement.counts[ALL_COHORTS];
    const currentCount = progress?.counts[cohort] || progress?.counts[ALL_COHORTS] || 0;
    const isComplete = currentCount >= totalCount;

    let requirementName = requirement.name;
    if (requirement.scoreboardDisplay === ScoreboardDisplay.Checkbox && totalCount > 1) {
        requirementName += ` (${totalCount})`;
    }

    const expirationYears = requirement.expirationDays / 365;

    return (
        <>
            <Stack spacing={3}>
                <Stack
                    direction='row'
                    justifyContent='space-between'
                    alignItems='center'
                    flexWrap='wrap'
                    rowGap={1}
                >
                    <Stack>
                        <Typography variant='h4'>{requirementName}</Typography>
                        <Typography variant='h5' color='text.secondary'>
                            {requirement.category}
                        </Typography>
                    </Stack>
                    <Stack direction='row' spacing={2} alignItems='center'>
                        {isComplete && (
                            <Chip
                                icon={<CheckIcon />}
                                label='Completed'
                                color='success'
                                onClick={() => setShowUpdateDialog(true)}
                            />
                        )}
                        {!isComplete && (
                            <Button
                                variant='contained'
                                onClick={() => setShowUpdateDialog(true)}
                            >
                                Update Progress
                            </Button>
                        )}
                    </Stack>
                </Stack>

                <Typography
                    variant='body1'
                    sx={{ whiteSpace: 'pre-line', mt: 3 }}
                    dangerouslySetInnerHTML={{ __html: requirement.description }}
                />

                {requirement.positions && (
                    <Grid container spacing={2}>
                        {requirement.positions.map((p) => (
                            <Grid key={p.fen} item xs='auto'>
                                <Position position={p} />
                            </Grid>
                        ))}
                    </Grid>
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

                {expirationYears > 0 && (
                    <Typography>
                        Progress on this task expires after{' '}
                        {expirationYears >= 1
                            ? `${expirationYears} year`
                            : `${Math.round(expirationYears * 12)} month`}
                        {expirationYears !== 1 && 's'}.
                    </Typography>
                )}
            </Stack>

            <ProgressDialog
                open={showUpdateDialog}
                onClose={() => setShowUpdateDialog(false)}
                requirement={requirement}
                cohort={user.dojoCohort}
                progress={progress}
                selectCohort
            />
        </>
    );
};

export default RequirementDisplay;
