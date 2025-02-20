import { Box, LinearProgress, Typography } from '@mui/material';

interface BadgeProgressProps {
    total: number;
    earned: number;
}

export function BadgeProgress({ total, earned }: BadgeProgressProps) {
    const progress = total > 0 ? (earned / total) * 100 : 0;
    return (
        <Box sx={{ mb: 2, width: '100%' }}>
            <Typography variant='body2' fontWeight='bold' textAlign='center' gutterBottom>
                {`You have earned ${earned} out of ${total} badges (${Math.round((earned / total) * 100)}%)`}
            </Typography>
            <LinearProgress
                variant='determinate'
                color='success'
                value={progress}
                sx={{ height: 10, borderRadius: 5 }}
            />
        </Box>
    );
}
