import { useState } from 'react';
import { Divider, Grid, IconButton, Stack, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

import {
    CustomTask,
    RequirementProgress,
    formatTime,
    getTotalTime,
} from '../../database/requirement';
import RequirementModal from '../../requirements/RequirementModal';
import ProgressDialog from './ProgressDialog';

interface CustomTaskProgressItemProps {
    progress?: RequirementProgress;
    task: CustomTask;
    cohort: string;
    isCurrentUser: boolean;
}

const CustomTaskProgressItem: React.FC<CustomTaskProgressItemProps> = ({
    progress,
    task,
    cohort,
    isCurrentUser,
}) => {
    const [showUpdateDialog, setShowUpdateDialog] = useState(false);
    const [showReqModal, setShowReqModal] = useState(false);

    const time = formatTime(getTotalTime(cohort, progress));

    return (
        <Stack spacing={2} mt={2}>
            <Grid
                container
                columnGap={0.5}
                alignItems='center'
                justifyContent='space-between'
            >
                <Grid
                    item
                    xs={9}
                    onClick={() => setShowReqModal(true)}
                    sx={{ cursor: 'pointer', position: 'relative' }}
                >
                    <Typography>{task.name}</Typography>
                    <Typography
                        color='text.secondary'
                        sx={{
                            WebkitLineClamp: 3,
                            display: '-webkit-box',
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            whiteSpace: 'pre-wrap',
                        }}
                    >
                        {task.description}
                    </Typography>
                    <Typography color='primary' variant='caption'>
                        View More
                    </Typography>
                </Grid>

                <Grid item xs={2} sm='auto'>
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

                        <IconButton
                            aria-label={`Update ${task.name}`}
                            onClick={() => setShowUpdateDialog(true)}
                        >
                            <EditIcon />
                        </IconButton>
                    </Stack>
                </Grid>
            </Grid>
            <Divider />

            {showReqModal && (
                <RequirementModal
                    open={showReqModal}
                    onClose={() => setShowReqModal(false)}
                    requirement={task}
                />
            )}

            {showUpdateDialog && (
                <ProgressDialog
                    open={showUpdateDialog}
                    onClose={() => setShowUpdateDialog(false)}
                    requirement={task}
                    cohort={cohort}
                    progress={progress}
                />
            )}
        </Stack>
    );
};

export default CustomTaskProgressItem;
