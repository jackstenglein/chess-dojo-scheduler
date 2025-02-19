import { Link } from '@/components/navigation/Link';
import { User } from '@/database/user';
import { ZoomOutMap } from '@mui/icons-material';
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    IconButton,
    Stack,
    Tooltip,
} from '@mui/material';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import postmortem2023 from './2023-postmortem.png';
import postmortem2024 from './2024-postmortem.png';
import { BadgCabinetDialog } from './BadgeCabinetDialog';
import BadgeDialog from './BadgeDialog';
import { Badge, getBadges } from './badgeHandler';
import CustomBadge from './CustomBadge';

export const BadgeCard = ({ user }: { user: User }) => {
    const [selectedBadge, setSelectedBadge] = useState<Badge | undefined>(undefined);
    const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false);
    const allBadges: Badge[] = getBadges(user);
    const badgeData: Badge[] = allBadges.filter((badge) => badge.isEarned);
    const [previousBadgeData, setPreviousBadgeData] = useState<Badge[]>(badgeData);
    const badges: JSX.Element[] = [];

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

            <BadgeDialog
                selectedBadge={selectedBadge}
                handleCloseDialog={handleCloseDialog}
            />

            <BadgCabinetDialog
                isOpen={isViewAllModalOpen}
                onClose={() => setIsViewAllModalOpen(false)}
                allBadges={allBadges}
            />
        </>
    );
};
