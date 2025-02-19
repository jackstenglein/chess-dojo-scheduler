import { Box, LinearProgress, Typography } from '@mui/material';
import { Badge } from './badgeHandler';

interface BadgeProgressProps {
    filteredBadges: () => Badge[];
}

const BadgeProgress: React.FC<BadgeProgressProps> = ({ filteredBadges }) => {
    const allBadges = filteredBadges();
    const earnedBadges = allBadges.filter((badge) => badge.isEarned).length;
    const totalBadges = allBadges.length;
    const progress = totalBadges > 0 ? (earnedBadges / totalBadges) * 100 : 0;

    return (
        <Box sx={{ mb: 2, width: '100%' }}>
            <Typography variant='body2' fontWeight='bold' textAlign='center' gutterBottom>
                {`You have earned ${earnedBadges} out of ${totalBadges} badges (${Math.round((earnedBadges / totalBadges) * 100)}%)`}
            </Typography>
            <LinearProgress
                variant='determinate'
                color='success'
                value={progress}
                sx={{ height: 10, borderRadius: 5 }}
            />
        </Box>
    );
};

export default BadgeProgress;
