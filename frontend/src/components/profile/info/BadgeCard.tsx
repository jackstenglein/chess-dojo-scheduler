import { Link } from '@/components/navigation/Link';
import { User, compareCohorts } from '@/database/user';
import CohortIcon from '@/scoreboard/CohortIcon';
import { Close as CloseIcon } from '@mui/icons-material';
import {
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
import { getEligibleBadges } from './badgeHandler';

export const BadgeCard = ({ user }: { user: User }) => {
    const [selectedBadge, setSelectedBadge] = useState<string[] | undefined>(undefined);

    const badgeData: string[][] = getEligibleBadges(user);
    const [previousBadgeImgs, setPreviousBadgeImgs] = useState<string[][]>(badgeData);

    const handleBadgeClick = (badge: string[]) => {
        setSelectedBadge(badge);
    };

    const handleCloseDialog = () => {
        setSelectedBadge(undefined);
    };

    useEffect(() => {
        const newBadge = badgeData.find(
            (badge, index) =>
                !previousBadgeImgs[index] || badge[0] !== previousBadgeImgs[index][0],
        );
        if (newBadge) {
            setSelectedBadge(newBadge);
        }

        setPreviousBadgeImgs([...badgeData]);
    }, [badgeData]);

    const badges =
        user.graduationCohorts
            ?.sort(compareCohorts)
            .filter((c, i) => user.graduationCohorts?.indexOf(c) === i)
            .map((c) => <CohortIcon key={c} cohort={c} />) ?? [];

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
                        width={40}
                        height={40}
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
                        width={40}
                        height={70}
                    />
                </Tooltip>
            </Link>,
        );
    }

    if (badgeData.length !== 0) {
        for (let i = 0; i < badgeData.length; i++) {
            badges.push(
                <Tooltip title={badgeData[i][1]} key={badgeData[i][0]}>
                    <img
                        src={badgeData[i][0]}
                        style={{ height: '40px', width: '40px', cursor: 'pointer' }}
                        alt={badgeData[i][1]}
                        onClick={() => handleBadgeClick(badgeData[i])}
                    />
                </Tooltip>,
            );
        }
    }

    if (badges.length === 0) {
        return null;
    }

    return (
        <>
            <Card>
                <CardHeader title='Badges' />
                <CardContent sx={{ pt: 0 }}>
                    <Stack direction='row' columnGap={0.75} flexWrap='wrap' rowGap={1}>
                        {badges}
                    </Stack>
                </CardContent>
            </Card>

            <Dialog open={selectedBadge !== undefined} onClose={handleCloseDialog}>
                {selectedBadge && (
                    <>
                        <DialogTitle
                            sx={{
                                backgroundColor: '#222222',
                                textAlign: 'center',
                                color: '#EEB312',
                                fontWeight: 'bold',
                            }}
                        >
                            {selectedBadge[1]}
                            <IconButton
                                aria-label='close'
                                onClick={handleCloseDialog}
                                sx={{
                                    position: 'absolute',
                                    right: 8,
                                    top: 8,
                                    color: (theme) => theme.palette.grey[500],
                                }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent
                            sx={{
                                backgroundColor: '#222222',
                                textAlign: 'center',
                            }}
                        >
                            <img
                                src={selectedBadge[0]}
                                alt={selectedBadge[1]}
                                style={{ maxWidth: '80%', borderRadius: '10px' }}
                            />
                            <Typography variant='body1' sx={{ mt: 2, color: '#EEB312' }}>
                                {selectedBadge[2]}
                            </Typography>
                        </DialogContent>
                    </>
                )}
            </Dialog>
        </>
    );
};
