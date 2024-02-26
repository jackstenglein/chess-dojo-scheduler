import EditIcon from '@mui/icons-material/Edit';
import {
    Checkbox,
    Chip,
    Divider,
    Grid,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { useState } from 'react';

import { useFreeTier } from '../../auth/Auth';
import {
    CustomTask,
    formatTime,
    getCurrentCount,
    getTotalTime,
    isExpired,
    isRequirement,
    Requirement,
    RequirementProgress,
    ScoreboardDisplay,
} from '../../database/requirement';
import RequirementModal from '../../requirements/RequirementModal';
import ScoreboardProgress from '../../scoreboard/ScoreboardProgress';
import CustomTaskProgressItem from './CustomTaskProgressItem';
import ProgressDialog from './ProgressDialog';

interface ProgressItemProps {
    progress?: RequirementProgress;
    requirement: Requirement | CustomTask;
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
    const isFreeTier = useFreeTier();

    if (!isRequirement(requirement)) {
        return (
            <CustomTaskProgressItem
                progress={progress}
                task={requirement}
                cohort={cohort}
                isCurrentUser={isCurrentUser}
            />
        );
    }

    const totalCount = requirement.counts[cohort] || 0;
    const currentCount = getCurrentCount(cohort, requirement, progress);
    const time = formatTime(getTotalTime(cohort, progress));
    const expired = isExpired(requirement, progress);

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
                    disabled={!isCurrentUser}
                />
            );
            break;

        case ScoreboardDisplay.ProgressBar:
        case ScoreboardDisplay.Minutes:
        case ScoreboardDisplay.Unspecified:
            DescriptionElement = (
                <ScoreboardProgress
                    value={currentCount}
                    max={totalCount}
                    min={requirement.startCount}
                    suffix={requirement.progressBarSuffix}
                    isTime={requirement.scoreboardDisplay === ScoreboardDisplay.Minutes}
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

        case ScoreboardDisplay.NonDojo:
            UpdateElement = (
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
            {showUpdateDialog && (
                <ProgressDialog
                    open={showUpdateDialog}
                    onClose={() => setShowUpdateDialog(false)}
                    requirement={requirement}
                    cohort={cohort}
                    progress={progress}
                />
            )}
            <Grid
                container
                columnGap={0.5}
                alignItems='center'
                justifyContent='space-between'
                position='relative'
            >
                <Grid
                    item
                    xs={9}
                    xl={
                        requirement.scoreboardDisplay === ScoreboardDisplay.NonDojo
                            ? 9
                            : 10
                    }
                    onClick={() => setShowReqModal(true)}
                    sx={{ cursor: 'pointer', position: 'relative' }}
                    id='task-details'
                >
                    <Stack
                        direction='row'
                        justifyContent='space-between'
                        flexWrap='wrap'
                        alignItems='center'
                    >
                        <Typography>{requirementName}</Typography>
                    </Stack>

                    <Typography
                        color='text.secondary'
                        dangerouslySetInnerHTML={{
                            __html: isFreeTier
                                ? requirement.freeDescription || requirement.description
                                : requirement.description,
                        }}
                        sx={{
                            WebkitLineClamp: 3,
                            display: '-webkit-box',
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            whiteSpace: 'pre-wrap',
                            '& ul': {
                                display: 'none',
                            },
                            '& ol': {
                                display: 'none',
                            },
                        }}
                    />
                    <Typography color='primary' variant='caption'>
                        View More
                    </Typography>
                    {DescriptionElement}
                </Grid>
                <Grid item xs={2} sm='auto' id='task-status'>
                    <Stack
                        direction='row'
                        alignItems='center'
                        justifyContent='end'
                        spacing={1}
                    >
                        <Typography
                            color='text.secondary'
                            sx={{ display: { xs: 'none', sm: 'initial' } }}
                            noWrap
                            textOverflow='unset'
                        >
                            {time}
                        </Typography>
                        {UpdateElement}
                    </Stack>
                </Grid>

                {expired && (
                    <Tooltip title='Your progress on this task has expired and it must be recompleted'>
                        <Chip
                            variant='outlined'
                            color='error'
                            label='Expired'
                            sx={{ position: 'absolute', right: 0, top: 0 }}
                        />
                    </Tooltip>
                )}
            </Grid>
            <Divider />

            {showReqModal && (
                <RequirementModal
                    open={showReqModal}
                    onClose={() => setShowReqModal(false)}
                    requirement={requirement}
                />
            )}
        </Stack>
    );
};

export default ProgressItem;
