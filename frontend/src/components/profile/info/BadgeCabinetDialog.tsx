import CloseIcon from '@mui/icons-material/Close';
import {
    Box,
    Card,
    Dialog,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    MenuItem,
    Select,
    Stack,
    Typography,
} from '@mui/material';
import { Badge, BadgeType } from './badgeHandler';
import BadgeProgress from './BadgeProgress';
import CustomBadge from './CustomBadge';

interface BadgeCabinetDialogProps {
    isOpen: boolean;
    onClose: () => void;
    badgeCategory: string;
    setBadgeCategory: (category: string) => void;
    allBadges: Badge[];
    allGradBadges: Badge[];
    handleBadgeClick: (badge: Badge) => void;
}

export const BadgCabinetDialog: React.FC<BadgeCabinetDialogProps> = ({
    isOpen,
    onClose,
    badgeCategory,
    setBadgeCategory,
    allBadges,
    allGradBadges,
    handleBadgeClick,
}) => {
    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            sx={{
                '& .MuiDialog-paper': {
                    width: '80vw',
                    maxWidth: '1000px',
                    minHeight: '500px',
                    borderRadius: 4,
                    boxShadow: 10,
                    padding: 3,
                },
            }}
        >
            <DialogTitle
                sx={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    position: 'relative',
                }}
            >
                All Badges
                <IconButton
                    aria-label='close'
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <FormControl sx={{ mb: 2, minWidth: 200 }}>
                    <Select
                        value={badgeCategory}
                        onChange={(e) => setBadgeCategory(e.target.value)}
                    >
                        <MenuItem value='all'>All Badges</MenuItem>
                        <MenuItem value='current'>Achieved Badges</MenuItem>
                        <MenuItem value='cohorts'>Graduations</MenuItem>
                        <MenuItem value='polgar'>Polgar Mates</MenuItem>
                        <MenuItem value='games'>Games</MenuItem>
                        <MenuItem value='annotation'>Annotations</MenuItem>
                    </Select>
                </FormControl>
                <Typography
                    variant='body1'
                    sx={{ textAlign: 'center', fontWeight: 'bold', mb: 2 }}
                >
                    {badgeCategory === 'current'
                        ? '🏆 These are the badges you have achieved! Keep grinding to earn more!'
                        : badgeCategory === 'all'
                          ? '🌟 View all available badges'
                          : ''}
                </Typography>
                <BadgeProgress
                    badgeCategory={badgeCategory}
                    allBadges={allBadges}
                    allGradBadges={allGradBadges}
                />
                <Stack
                    direction='column'
                    spacing={2}
                    alignItems='center'
                    sx={{
                        padding: 2,
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: 3,
                        backdropFilter: 'blur(8px)',
                        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)',
                    }}
                >
                    {[
                        ...(badgeCategory === 'all'
                            ? allGradBadges.concat(allBadges)
                            : badgeCategory === 'current'
                              ? allGradBadges
                                    .filter((b) => b.isEarned)
                                    .concat(allBadges.filter((b) => b.isEarned))
                              : badgeCategory === 'polgar'
                                ? allBadges.filter(
                                      (b) =>
                                          b.type === BadgeType.PolgarMateOne ||
                                          b.type === BadgeType.PolgarMateTwo ||
                                          b.type === BadgeType.PolgarMateThree,
                                  )
                                : badgeCategory === 'games'
                                  ? allBadges.filter(
                                        (b) => b.type === BadgeType.ClassicalGames,
                                    )
                                  : badgeCategory === 'annotation'
                                    ? allBadges.filter(
                                          (b) => b.type === BadgeType.AnnotateGames,
                                      )
                                    : allGradBadges),
                    ]
                        .sort((a, b) => (b.isEarned ? 1 : 0) - (a.isEarned ? 1 : 0))
                        .map((badge, idx) => (
                            <Card
                                key={idx}
                                sx={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: 2,
                                    boxShadow: 3,
                                }}
                            >
                                <Box
                                    sx={{
                                        height: '80px',
                                        width: '80px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: badge.isEarned
                                            ? 'rgba(255, 223, 186, 0.8)'
                                            : 'rgba(255,255,255,0.1)',
                                        borderRadius: '50%',
                                        border: '3px solid',
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                                        filter: badge.isEarned
                                            ? 'none'
                                            : 'grayscale(60%) opacity(0.6)',
                                        marginRight: 2,
                                    }}
                                >
                                    <CustomBadge
                                        badge={badge}
                                        handleBadgeClick={handleBadgeClick}
                                        isBlocked={!badge.isEarned}
                                    />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography
                                        variant='h6'
                                        fontWeight='bold'
                                        color={badge.isEarned ? 'text' : 'text.secondary'}
                                    >
                                        {badge.title}
                                    </Typography>
                                    <Typography variant='body2'>
                                        {badge.isEarned ? badge.message : ''}
                                    </Typography>
                                </Box>
                            </Card>
                        ))}
                </Stack>
            </DialogContent>
        </Dialog>
    );
};
