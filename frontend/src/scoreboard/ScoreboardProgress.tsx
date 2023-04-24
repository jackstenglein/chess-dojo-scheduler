import { useState } from 'react';
import { Box, LinearProgress, LinearProgressProps, Typography } from '@mui/material';

import { Requirement } from '../database/requirement';
import { useAuth } from '../auth/Auth';
import ProgressDialog from '../profile/progress/ProgressDialog';

interface ScoreboardProgressProps {
    value: number;
    max: number;
    min: number;
    label?: string;
    username?: string;
    cohort?: string;
    requirement?: Requirement;
    fullHeight?: boolean;
    suffix?: string;
}

const ScoreboardProgress: React.FC<LinearProgressProps & ScoreboardProgressProps> = ({
    value,
    max,
    min,
    label,
    username,
    cohort,
    requirement,
    fullHeight,
    suffix,
    ...rest
}) => {
    const [showUpdateDialog, setShowUpdateDialog] = useState(false);
    const user = useAuth().user!;

    const canUpdate = requirement && cohort && user.username === username;
    const onClick = canUpdate ? () => setShowUpdateDialog(true) : undefined;

    const normalized = ((value - min) * 100) / (max - min);

    return (
        <>
            <Box
                sx={{
                    width: 1,
                    height: fullHeight ? 1 : undefined,
                    display: 'flex',
                    alignItems: 'center',
                }}
                onClick={onClick}
            >
                <Box sx={{ flexGrow: 1, mr: 1 }}>
                    <LinearProgress variant='determinate' {...rest} value={normalized} />
                </Box>
                <Box>
                    <Typography variant='body2' color='text.secondary'>
                        {label ? label : `${value}/${max}${suffix || ''}`}
                    </Typography>
                </Box>
            </Box>

            {canUpdate && showUpdateDialog && (
                <ProgressDialog
                    open={showUpdateDialog}
                    onClose={() => setShowUpdateDialog(false)}
                    requirement={requirement}
                    cohort={cohort}
                    progress={user.progress[requirement.id]}
                />
            )}
        </>
    );
};

export default ScoreboardProgress;
