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
import { useEffect, useMemo, useState } from 'react';
import postmortem2023 from './2023-postmortem.png';
import postmortem2024 from './2024-postmortem.png';
import { BadgCabinetDialog } from './BadgeCabinetDialog';
import BadgeDialog from './BadgeDialog';
import { Badge, getBadges } from './badgeHandler';
import { BadgeImage } from './BadgeImage';

export const BadgeCard = ({ user }: { user: User }) => {
    const [selectedBadge, setSelectedBadge] = useState<Badge>();
    const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false);

    const [allBadges, earnedBadges] = useMemo(() => {

        const allBadges = getBadges(user, false);
        const earnedBadges = getBadges(user, true).filter((badge) => badge.isEarned);
        return [allBadges, earnedBadges];
    }, [user]);

    const [previousEarnedBadges, setPreviousEarnedBadges] = useState(earnedBadges);
    const badges: JSX.Element[] = [];

    const handleBadgeClick = (badge: Badge) => {
        setSelectedBadge(badge);
    };

    const handleCloseDialog = () => {
        setSelectedBadge(undefined);
    };

    useEffect(() => {
        const newBadge = earnedBadges.find(
            (badge, index) =>
                !previousEarnedBadges[index] ||
                badge.image !== previousEarnedBadges[index].image,
        );
        if (newBadge) {
            setSelectedBadge(newBadge);
            setPreviousEarnedBadges(earnedBadges);
        }
    }, [earnedBadges, previousEarnedBadges, setSelectedBadge, setPreviousEarnedBadges]);

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

    for (const badge of earnedBadges) {
        badges.push(<BadgeImage badge={badge} onClick={handleBadgeClick} />);
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
                <CardContent sx={{ pt: 1, pb: 2, px: 2 }}>
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
