import { Box, LinearProgress, Typography } from '@mui/material';
import { Badge, BadgeType } from './badgeHandler';

interface BadgeProgressProps {
    badgeCategory: string;
    allBadges: Badge[];
    allGradBadges: Badge[];
}

const BadgeProgress: React.FC<BadgeProgressProps> = ({
    badgeCategory,
    allBadges,
    allGradBadges,
}) => {
    const getFilteredBadges = () => {
        switch (badgeCategory) {
            case 'all':
                return allGradBadges.concat(allBadges);
            case 'current':
                return allGradBadges
                    .filter((badge) => badge.isEarned)
                    .concat(allBadges.filter((badge) => badge.isEarned));
            case 'polgar':
                return allBadges.filter(
                    (badge) =>
                        badge.type === BadgeType.PolgarMateOne ||
                        badge.type === BadgeType.PolgarMateTwo ||
                        badge.type === BadgeType.PolgarMateThree,
                );
            case 'games':
                return allBadges.filter(
                    (badge) => badge.type === BadgeType.ClassicalGames,
                );
            case 'annotation':
                return allBadges.filter(
                    (badge) => badge.type === BadgeType.AnnotateGames,
                );
            default:
                return allGradBadges;
        }
    };

    const filteredBadges = getFilteredBadges();
    const earnedBadges = filteredBadges.filter((badge) => badge.isEarned).length;
    const totalBadges = filteredBadges.length;
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
