import { Link } from '@/components/navigation/Link';
import { User, compareCohorts } from '@/database/user';
import CohortIcon from '@/scoreboard/CohortIcon';
import { Close as CloseIcon } from '@mui/icons-material';
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import postmortem2023 from './2023-postmortem.png';
import postmortem2024 from './2024-postmortem.png';
import { Badge, getDojoerBadge, getEligibleBadges } from './badgeHandler';
import CustomBadge from './CustomBadge';

export const BadgeCard = ({ user }: { user: User }) => {
    const [selectedBadge, setSelectedBadge] = useState<Badge | undefined>(undefined);
    const badgeData: Badge[] = getEligibleBadges(user);
    const [previousBadgeData, setPreviousBadgeData] = useState<Badge[]>(badgeData);
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
        user.graduationCohorts
            ?.sort(compareCohorts)
            .filter((c, i) => user.graduationCohorts?.indexOf(c) === i)
            .map((c) => <CohortIcon key={c} cohort={c} size={50} />) ?? [];

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
        badges.push(
            <CustomBadge badge={badge} handleBadgeClick={handleBadgeClick}/>
        );
    }

    for (const badge of badgeData) {
        badges.push(
            <CustomBadge badge={badge} handleBadgeClick={handleBadgeClick}/>
        );
    }

    if (badges.length === 0) {
        return null;
    }

    return (
        <>
            <Card>
                <CardHeader title='Badges' />
                <CardContent sx={{ pt: 0 }}>
                    <Stack
                        direction='row'
                        columnGap={0.75}
                        flexWrap='wrap'
                        rowGap={1}
                        alignItems='center'
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
        </>
    );
};
