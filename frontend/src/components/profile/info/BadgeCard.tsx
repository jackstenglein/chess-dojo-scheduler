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
        if (badgeData.length > previousBadgeImgs.length) {
            const newBadge = badgeData.find(
                (badge, index) =>
                    !previousBadgeImgs[index] || badge[0] !== previousBadgeImgs[index][0],
            );
            if (newBadge) {
                setSelectedBadge(newBadge);
            }
        }
        setPreviousBadgeImgs([...badgeData]);
    }, [badgeData]);

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

    if (badgeData.length !== 0) {
        for (const badge of badgeData) {
            badges.push(
                <Tooltip title={badge[1]} key={badge[0]}>
                    <img
                        src={badge[0]}
                        style={{
                            height: '50px',
                            width: '50px',
                            cursor: 'pointer',
                            boxShadow:
                                badge[3] === 'rare'
                                    ? `0 0 12px 4px ${badge[4]}`
                                    : undefined,
                            borderRadius: '8px',
                            transition: 'transform 0.2s',
                        }}
                        alt={badge[1]}
                        onClick={() => handleBadgeClick(badge)}
                        onMouseEnter={(e) =>
                            (e.currentTarget.style.transform = 'scale(1.1)')
                        }
                        onMouseLeave={(e) =>
                            (e.currentTarget.style.transform = 'scale(1)')
                        }
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
                                className='glow-image'
                            />
                            <Typography variant='body1' sx={{ mt: 2, color: '#EEB312' }}>
                                {selectedBadge[2]}
                            </Typography>
                        </DialogContent>
                    </>
                )}
            </Dialog>

            <style jsx>{`
                .glow-image {
                    max-width: 90%;
                    border-radius: 10px;
                    animation: glow-animation 1.5s infinite alternate;
                }
                @keyframes glow-animation {
                    0% {
                        box-shadow:
                            0 0 10px
                                ${selectedBadge !== undefined &&
                                selectedBadge[3] === 'rare'
                                    ? selectedBadge[4]
                                    : '#C0C0C0'},
                            0 0 20px
                                ${selectedBadge !== undefined &&
                                selectedBadge[3] === 'rare'
                                    ? selectedBadge[4]
                                    : '#C0C0C0'};
                    }
                    100% {
                        box-shadow:
                            0 0 40px
                                ${selectedBadge !== undefined &&
                                selectedBadge[3] === 'rare'
                                    ? selectedBadge[4]
                                    : '#C0C0C0'},
                            0 0 40px
                                ${selectedBadge !== undefined &&
                                selectedBadge[3] === 'rare'
                                    ? selectedBadge[4]
                                    : '#C0C0C0'};
                    }
                }
            `}</style>
        </>
    );
};
