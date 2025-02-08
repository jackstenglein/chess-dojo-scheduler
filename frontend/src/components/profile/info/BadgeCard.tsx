import { useRequirements } from '@/api/cache/requirements';
import { Link } from '@/components/navigation/Link';
import { ALL_COHORTS, User, compareCohorts } from '@/database/user';
import { calculateTacticsRating } from '@/exams/view/exam';
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
import { Badge, getEligibleBadges, getTacticsChampionBadge } from './badgeHandler';

export const BadgeCard = ({ user }: { user: User }) => {
    const [selectedBadge, setSelectedBadge] = useState<Badge | undefined>(undefined);
    const badgeData: Badge[] = getEligibleBadges(user);
    const [previousBadgeImgs, setPreviousBadgeImgs] = useState<Badge[]>(badgeData);
    const { requirements } = useRequirements(ALL_COHORTS, true);
    const tacticsRating = calculateTacticsRating(user, requirements);
    const minCohort = parseInt(user.dojoCohort);
    const isProvisional = tacticsRating.components.some((c) => c.rating < 0);

    const handleBadgeClick = (badge: Badge) => {
        setSelectedBadge(badge);
    };

    const handleCloseDialog = () => {
        setSelectedBadge(undefined);
    };

    useEffect(() => {
        const newBadge = badgeData.find(
            (badge, index) =>
                !previousBadgeImgs[index] ||
                badge.image !== previousBadgeImgs[index].image,
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

    if (!isProvisional && tacticsRating.overall > minCohort) {
        const champion = getTacticsChampionBadge();
        badges.push(
            <Tooltip title={champion.title}>
                <img
                    src={champion.image}
                    style={{
                        height: '50px',
                        width: '50px',
                        cursor: 'pointer',
                        filter: champion.israre
                            ? `drop-shadow(0 0 12px ${champion.rareglowhexcode})`
                            : undefined,
                        borderRadius: '8px',
                        transition: 'transform 0.2s',
                    }}
                    alt={champion.title}
                    onClick={() => handleBadgeClick(champion)}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    className={champion.israre ? 'glow' : ''}
                />
            </Tooltip>,
        );
    }

    if (badgeData.length !== 0) {
        for (const badge of badgeData) {
            badges.push(
                <Tooltip title={badge.title}>
                    <img
                        src={badge.image}
                        style={{
                            height: '50px',
                            width: '50px',
                            cursor: 'pointer',
                            filter: badge.israre
                                ? `drop-shadow(0 0 12px ${badge.rareglowhexcode})`
                                : undefined,
                            borderRadius: '8px',
                            transition: 'transform 0.2s',
                        }}
                        alt={badge.title}
                        onClick={() => handleBadgeClick(badge)}
                        onMouseEnter={(e) =>
                            (e.currentTarget.style.transform = 'scale(1.1)')
                        }
                        onMouseLeave={(e) =>
                            (e.currentTarget.style.transform = 'scale(1)')
                        }
                        className={badge.israre ? 'glow' : ''}
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
                            {selectedBadge.title}
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
                                src={selectedBadge.image}
                                alt={selectedBadge.title}
                                className='glow-image'
                            />
                            <Typography variant='body1' sx={{ mt: 2, color: '#EEB312' }}>
                                {selectedBadge.message}
                            </Typography>
                        </DialogContent>
                    </>
                )}
            </Dialog>

            <style jsx>{`
                .glow {
                    animation: glow-animation 1.5s infinite alternate;
                    filter: filter: drop-shadow(0 0 12px
                            ${selectedBadge?.rareglowhexcode || '#C0C0C0'});
                }

                @keyframes glow-animation {
                    0% {
                        filter: drop-shadow(0 0 8px
                            ${selectedBadge?.rareglowhexcode || '#C0C0C0'});
                    }
                    100% {
                        filter: drop-shadow(0 0 16px
                            ${selectedBadge?.rareglowhexcode || '#C0C0C0'});
                    }
                }

                .glow-image {
                    max-width: 90%;
                    border-radius: 10px;
                    animation: glow-animation 1.5s infinite alternate;
                }
            `}</style>
        </>
    );
};
