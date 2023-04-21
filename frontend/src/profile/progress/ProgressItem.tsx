import { useState } from 'react';
import { Typography, Stack, Checkbox, Divider, IconButton, Grid } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

import {
    getCurrentCount,
    Requirement,
    RequirementProgress,
    ScoreboardDisplay,
} from '../../database/requirement';
import ScoreboardProgress from '../../scoreboard/ScoreboardProgress';
import ProgressDialog from './ProgressDialog';
import RequirementModal from '../../requirements/RequirementModal';

interface ProgressItemProps {
    progress?: RequirementProgress;
    requirement: Requirement;
    cohort: string;
    isCurrentUser: boolean;
}

const ProgressItem: React.FC<ProgressItemProps> = ({
    progress,
    requirement,
    cohort,
    isCurrentUser,
}) => {
    const [showUpdateDialog, setShowUpdateDialog] = useState(false);
    const [showReqModal, setShowReqModal] = useState(false);

    const totalCount = requirement.counts[cohort] || 0;
    const currentCount = getCurrentCount(cohort, requirement, progress);

    let DescriptionElement = null;
    let UpdateElement = null;

    switch (requirement.scoreboardDisplay) {
        case ScoreboardDisplay.Hidden:
        case ScoreboardDisplay.Checkbox:
            UpdateElement = (
                <Checkbox
                    aria-label={`Checkbox ${requirement.name}`}
                    checked={currentCount >= totalCount}
                    onClick={() => setShowUpdateDialog(true)}
                />
            );
            break;

        case ScoreboardDisplay.ProgressBar:
        case ScoreboardDisplay.Unspecified:
            DescriptionElement = (
                <ScoreboardProgress
                    value={currentCount}
                    max={totalCount}
                    min={requirement.startCount}
                />
            );
            UpdateElement =
                currentCount >= totalCount ? (
                    <Checkbox checked onClick={() => setShowUpdateDialog(true)} />
                ) : !isCurrentUser ? null : (
                    <IconButton
                        aria-label={`Update ${requirement.name}`}
                        onClick={() => setShowUpdateDialog(true)}
                    >
                        <EditIcon />
                    </IconButton>
                );
            break;
    }

    let requirementName = requirement.name;
    if (requirement.scoreboardDisplay === ScoreboardDisplay.Checkbox && totalCount > 1) {
        requirementName += ` (${totalCount})`;
    }

    return (
        <Stack spacing={2} mt={2}>
            <ProgressDialog
                open={showUpdateDialog}
                onClose={() => setShowUpdateDialog(false)}
                requirement={requirement}
                cohort={cohort}
                progress={progress}
            />
            <Grid
                container
                columnGap={0.5}
                alignItems='center'
                justifyContent='space-between'
            >
                <Grid
                    item
                    xs={9}
                    xl={10}
                    onClick={() => setShowReqModal(true)}
                    sx={{ cursor: 'pointer', position: 'relative' }}
                >
                    <Typography>{requirementName}</Typography>
                    <Typography
                        color='text.secondary'
                        dangerouslySetInnerHTML={{
                            __html: requirement.description,
                        }}
                        sx={{
                            WebkitLineClamp: 3,
                            display: '-webkit-box',
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            whiteSpace: 'pre-wrap',
                        }}
                    />
                    <Typography color='primary' variant='caption'>
                        View More
                    </Typography>
                    {DescriptionElement}
                </Grid>
                <Grid item xs={2} xl={1}>
                    <Stack direction='row' alignItems='center' justifyContent='end'>
                        {UpdateElement}
                    </Stack>
                </Grid>
            </Grid>
            <Divider />

            <RequirementModal
                open={showReqModal}
                onClose={() => setShowReqModal(false)}
                requirement={requirement}
            />
        </Stack>
    );
};

export default ProgressItem;
