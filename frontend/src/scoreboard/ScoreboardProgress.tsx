import { Box, LinearProgress, LinearProgressProps, Typography } from '@mui/material';
import { useState } from 'react';
import { useAuth } from '../auth/Auth';
import { Requirement, formatTime } from '../database/requirement';
import ProgressDialog from '../profile/progress/ProgressDialog';

interface ProgressTextProps {
    value: number;
    max?: number;
    min?: number;
    label?: string;
    suffix?: string;
    isTime?: boolean;
}
export const ProgressText: React.FC<ProgressTextProps> = ({
    value,
    max,
    min,
    label,
    suffix,
    isTime,
}) => {
    let formattedValue = value.toString();
    let formattedMin = min?.toString();
    let formattedMax = max?.toString();
    const formattedSuffix = suffix ?? '';

    if (isTime) {
        formattedValue = formatTime(value);
        if (max !== undefined) {
            formattedMax = formatTime(max);
        }

        if (min !== undefined) {
            formattedMin = formatTime(min);
        }
    }
    return (
        <Typography
            whiteSpace='no-wrap'
            variant='body2'
            color='text.secondary'
            sx={{ fontWeight: 'bold' }}
        >
            {label
                ? label
                : formattedMin !== undefined && formattedMax !== undefined
                  ? `${formattedValue} / ${formattedMax} ${formattedSuffix}`
                  : `${formattedValue} ${formattedSuffix}`}
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
                    <Box>
                        <ProgressText
                            label={label}
                            isTime={isTime}
                            suffix={suffix}
                            value={value}
                            min={min}
                            max={max}
                        />
                    </Box>
                )}
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
