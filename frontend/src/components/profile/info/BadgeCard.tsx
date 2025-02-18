import { Link } from '@/components/navigation/Link';
import { User } from '@/database/user';
import { Close as CloseIcon, ZoomOutMap } from '@mui/icons-material';
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Dialog,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    MenuItem,
    Select,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import postmortem2023 from './2023-postmortem.png';
import postmortem2024 from './2024-postmortem.png';
import {
    Badge,
    BadgeType,
    getAllCohortBadges,
    getBadges,
    getDojoerBadge,
} from './badgeHandler';
import BadgeProgress from './BadgeProgress';
import CustomBadge from './CustomBadge';

export const BadgeCard = ({ user }: { user: User }) => {
    const [selectedBadge, setSelectedBadge] = useState<Badge | undefined>(undefined);
    const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false);
    const allBadges: Badge[] = getBadges(user);
    console.log(allBadges);
    const allGradBadges: Badge[] = getAllCohortBadges(user);
    console.log(allGradBadges);
    const badgeData: Badge[] = allBadges.filter((badge) => badge.isEarned);
    const [previousBadgeData, setPreviousBadgeData] = useState<Badge[]>(badgeData);
    const [badgeCategory, setBadgeCategory] = useState('all');
    // const { requirements } = useRequirements(ALL_COHORTS, true);
    // const tacticsRating = calculateTacticsRating(user, requirements);
    // const minCohort = parseInt(user.dojoCohort);
    // const isProvisional = tacticsRating.components.some((c) => c.rating < 0);

    const handleBadgeClick = (badge: Badge) => {
        setSelectedBadge(badge);
    };

    const handleCloseDialog = () => {
        setSelectedBadge(undefined);
    };

    useEffect(() => {
        const newBadge = badgeData.find(
            (badge, index) =>
                !previousBadgeData[index] ||
                badge.image !== previousBadgeData[index].image,
        );
        if (newBadge) {
            setSelectedBadge(newBadge);
            setPreviousBadgeData(badgeData);
        }
    }, [badgeData, previousBadgeData, setSelectedBadge, setPreviousBadgeData]);

    const badges =
        allGradBadges
            .filter((c) => c.isEarned)
            .map((c) => (
                <CustomBadge
                    key={c.title}
                    badge={c}
                    handleBadgeClick={handleBadgeClick}
                />
            )) ?? [];

    if (!user.createdAt || user.createdAt < '2023-12') {
        badges.push(
            <Link
                key='postmortem-2023'
                href={`/profile/${user.username}/postmortem/2023`}
            >
                <Tooltip title='View my 2023 postmortem!'>
                    <Image
                        src={postmortem2023}
                        alt='2023 postmortem'
                        width={50}
                        height={50}
                    />
                </Tooltip>
            </Link>,
        );
    }

    if (!user.createdAt || user.createdAt < '2024-12') {
        badges.push(
            <Link
                key='postmortem-2024'
                href={`/profile/${user.username}/postmortem/2024`}
            >
                <Tooltip title='View my 2024 postmortem!'>
                    <Image
                        src={postmortem2024}
                        alt='2024 postmortem'
                        width={50}
                        height={50}
                    />
                </Tooltip>
            </Link>,
        );
    }

    // if (!isProvisional && tacticsRating.overall > minCohort) {
    //     const champion = getTacticsChampionBadge();
    //     badges.push(
    //         <Tooltip title={champion.title}>
    //             <img
    //                 src={champion.image}
    //                 style={{
    //                     height: '50px',
    //                     width: '50px',
    //                     cursor: 'pointer',
    //                     filter: champion.israre
    //                         ? `drop-shadow(0 0 12px ${champion.rareglowhexcode})`
    //                         : undefined,
    //                     borderRadius: '8px',
    //                     transition: 'transform 0.2s',
    //                 }}
    //                 alt={champion.title}
    //                 onClick={() => handleBadgeClick(champion)}
    //                 onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
    //                 onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    //                 className={champion.israre ? 'glow' : ''}
    //             />
    //         </Tooltip>,
    //     );
    // }

    if (!user.createdAt) {
        const badge = getDojoerBadge();
        badges.push(<CustomBadge badge={badge} handleBadgeClick={handleBadgeClick} />);
    }

    for (const badge of badgeData) {
        badges.push(<CustomBadge badge={badge} handleBadgeClick={handleBadgeClick} />);
    }

    if (badges.length === 0) {
        return null;
    }

    return (
        <>
            <Card>
                <Stack
                    direction='row'
                    justifyContent='space-between'
                    alignItems='center'
                    px={2}
                    pt={2}
                >
                    <CardHeader title='Badges' sx={{ p: 0 }} />
                    <Tooltip title='View All Badges'>
                        <IconButton
                            color='primary'
                            onClick={() => setIsViewAllModalOpen(true)}
                        >
                            <ZoomOutMap />
                        </IconButton>
                    </Tooltip>
                </Stack>
                <CardContent sx={{ pt: 0, pb: 2, px: 2 }}>
                    <Stack
                        direction='row'
                        columnGap={0.75}
                        flexWrap='wrap'
                        rowGap={1}
                        alignItems='center'
                        sx={{ p: 1 }}
                    >
                        {badges.map((badge, idx) => (
                            <Box
                                key={idx}
                                sx={{
                                    height: '50px',
                                    width: '50px',
                                    '&:hover': {
                                        transform: 'scale(1.1)',
                                        transition: 'transform 0.2s',
                                    },
                                }}
                            >
                                {badge}
                            </Box>
                        ))}
                    </Stack>
                </CardContent>
            </Card>

            <Dialog open={selectedBadge !== undefined} onClose={handleCloseDialog}>
                {selectedBadge && (
                    <>
                        <DialogTitle
                            sx={{
                                textAlign: 'center',
                                fontWeight: 'bold',
                            }}
                        >
                            {selectedBadge.title}
                            <IconButton
                                aria-label='close'
                                onClick={handleCloseDialog}
                                sx={{
                                    position: 'absolute',
                                    right: 8,
                                    top: 8,
                                }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent
                            sx={{
                                textAlign: 'center',
                                overflow: 'visible',
                                '@keyframes glow-animation': selectedBadge.glowHexcode
                                    ? {
                                          '0%': {
                                              filter: `drop-shadow(0 0 8px ${selectedBadge.glowHexcode})`,
                                          },
                                          '100%': {
                                              filter: `drop-shadow(0 0 16px ${selectedBadge.glowHexcode})`,
                                          },
                                      }
                                    : undefined,
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    position: 'relative',
                                    width: '90%',
                                    aspectRatio: 1,
                                    margin: 'auto',
                                }}
                            >
                                <Image
                                    src={selectedBadge.image}
                                    alt={selectedBadge.title}
                                    fill
                                    style={{
                                        borderRadius: '10px',
                                        animation: selectedBadge.glowHexcode
                                            ? 'glow-animation 1.5s infinite alternate'
                                            : undefined,
                                        filter: selectedBadge.glowHexcode
                                            ? `drop-shadow(0 0 12px ${selectedBadge.glowHexcode})`
                                            : undefined,
                                    }}
                                />
                            </Box>
                            <Typography variant='body1'>
                                {selectedBadge.message}
                            </Typography>
                        </DialogContent>
                    </>
                )}
            </Dialog>

            <Dialog
                open={isViewAllModalOpen}
                onClose={() => setIsViewAllModalOpen(false)}
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
                        onClick={() => setIsViewAllModalOpen(false)}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                        }}
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
                        sx={{
                            textAlign: 'center',
                            fontWeight: 'bold',
                            mb: 2,
                        }}
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
                                        .filter((badge) => badge.isEarned)
                                        .concat(
                                            allBadges.filter((badge) => badge.isEarned),
                                        )
                                  : badgeCategory === 'polgar'
                                    ? allBadges.filter(
                                          (badge) =>
                                              badge.type === BadgeType.PolgarMateOne ||
                                              badge.type === BadgeType.PolgarMateTwo ||
                                              badge.type === BadgeType.PolgarMateThree,
                                      )
                                    : badgeCategory === 'games'
                                      ? allBadges.filter(
                                            (badge) =>
                                                badge.type === BadgeType.ClassicalGames,
                                        )
                                      : badgeCategory === 'annotation'
                                        ? allBadges.filter(
                                              (badge) =>
                                                  badge.type === BadgeType.AnnotateGames,
                                          )
                                        : allGradBadges),
                        ]
                            .sort((a, b) => (b.isEarned ? 1 : -1)) // Sort to show earned badges on top
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
                                            color={
                                                badge.isEarned ? 'text' : 'text.secondary'
                                            }
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
        </>
    );
};
