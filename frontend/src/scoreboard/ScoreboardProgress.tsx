import { Box, LinearProgress, LinearProgressProps, Typography } from '@mui/material';
import { useState } from 'react';
import { useAuth } from '../auth/Auth';
import { Requirement, formatTime } from '../database/requirement';
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
    isTime?: boolean;
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
    isTime,
    ...rest
}) => {
    const [showUpdateDialog, setShowUpdateDialog] = useState(false);
    const { user } = useAuth();

    const canUpdate = requirement && cohort && user?.username === username;
    const onClick = canUpdate ? () => setShowUpdateDialog(true) : undefined;

    const normalized = ((value - min) * 100) / (max - min);
    const displayValue = Math.min(Math.max(normalized, 0), 100);

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
                    <LinearProgress
                        variant='determinate'
                        {...rest}
                        value={displayValue}
                    />
                </Box>
                <Box>
                    <Typography variant='body2' color='text.secondary'>
                        {label
                            ? label
                            : isTime
                              ? `${formatTime(value)} / ${formatTime(max)}`
                              : `${Math.max(value, min)} / ${max} ${suffix || ''}`}
                    </Typography>
                </Box>
            </Box>

            {canUpdate && showUpdateDialog && (
                <ProgressDialog
                    open={showUpdateDialog}
                    onClose={() => setShowUpdateDialog(false)}
                    requirement={requirement}
                    cohort={cohort}
                    progress={user?.progress[requirement.id]}
                />
            )}
        </>
    );
};

export default ScoreboardProgress;
