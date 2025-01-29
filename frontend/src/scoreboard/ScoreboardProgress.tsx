import { TaskDialog, TaskDialogView } from '@/components/profile/trainingPlan/TaskDialog';
import { TimelineProvider } from '@/profile/activity/useTimeline';
import { Box, LinearProgress, LinearProgressProps, Typography } from '@mui/material';
import { useState } from 'react';
import { useAuth } from '../auth/Auth';
import { Requirement, formatTime } from '../database/requirement';

interface ProgressTextProps {
    value?: number;
    max?: number;
    min?: number;
    label?: string;
    suffix?: string;
    isTime?: boolean;
}

export const ProgressText = ({
    value = 0,
    max = 0,
    min = 0,
    label,
    suffix = '',
    isTime,
}: ProgressTextProps) => {
    let formattedLabel: string;

    if (label) {
        formattedLabel = label;
    } else if (isTime) {
        formattedLabel = `${formatTime(value)} / ${formatTime(max)}`;
    } else {
        formattedLabel = `${Math.max(value, min)} / ${max} ${suffix}`;
    }

    return (
        <Typography
            whiteSpace='no-wrap'
            variant='body2'
            color='text.secondary'
            sx={{ fontWeight: 'bold' }}
        >
            {formattedLabel}
        </Typography>
    );
};

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
    hideProgressText?: boolean;
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
    hideProgressText,
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
                {!hideProgressText && (
                    <ProgressText
                        label={label}
                        isTime={isTime}
                        suffix={suffix}
                        value={value}
                        min={min}
                        max={max}
                    />
                )}
            </Box>

            {canUpdate && showUpdateDialog && user && (
                <TimelineProvider owner={user.username}>
                    <TaskDialog
                        open
                        onClose={() => setShowUpdateDialog(false)}
                        task={requirement}
                        initialView={TaskDialogView.Progress}
                        cohort={cohort}
                        progress={user.progress[requirement.id]}
                    />
                </TimelineProvider>
            )}
        </>
    );
};

export default ScoreboardProgress;
