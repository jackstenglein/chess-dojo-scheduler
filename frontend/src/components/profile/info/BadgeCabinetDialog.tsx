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
import { useState } from 'react';
import { Badge, BadgeType, MiscBadgeType } from './badgeHandler';
import BadgeProgress from './BadgeProgress';
import CustomBadge from './CustomBadge';

interface BadgeCabinetDialogProps {
    isOpen: boolean;
    onClose: () => void;
    allBadges: Badge[];
}

export enum BadgeCategory {
    All = 'All Badges',
    Achieved = 'Achieved Badges',
    Graduation = 'Graduations',
    Polgar = 'Polgar Mates',
    Games = 'Games',
    Annotation = 'Annotations',
}

export function BadgCabinetDialog({
    isOpen,
    onClose,
    allBadges,
}: BadgeCabinetDialogProps) {
    const [badgeCategory, setBadgeCategory] = useState(BadgeCategory.All);

    const filteredBadges = () => {
        switch (badgeCategory) {
            case BadgeCategory.Achieved:
                return allBadges.filter((b) => b.isEarned);
            case BadgeCategory.Graduation:
                return allBadges.filter((b) => b.type === MiscBadgeType.Graduation);
            case BadgeCategory.Polgar:
                return allBadges.filter(
                    (b) =>
                        b.type === BadgeType.PolgarMateOne ||
                        b.type === BadgeType.PolgarMateTwo ||
                        b.type === BadgeType.PolgarMateThree,
                );
            case BadgeCategory.Games:
                return allBadges.filter((b) => b.type === BadgeType.ClassicalGames);
            case BadgeCategory.Annotation:
                return allBadges.filter((b) => b.type === BadgeType.AnnotateGames);
            default:
                return allBadges;
        }
    };

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
                <FormControl>
                    <Select
                        value={badgeCategory}
                        onChange={(e) =>
                            setBadgeCategory(e.target.value as BadgeCategory)
                        }
                    >
                        {Object.entries(BadgeCategory).map(([key, value]) => (
                            <MenuItem key={key} value={value}>
                                {value}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <BadgeProgress filteredBadges={filteredBadges} />
                <Stack>
                    {filteredBadges()
                        .sort((a, b) => Number(b.isEarned) - Number(a.isEarned))
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
}
