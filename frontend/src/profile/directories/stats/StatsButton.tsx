'use client';

import { useApi } from '@/api/Api';
import { StatsApiResponse } from '@/api/directoryApi';
import { RatingSystem } from '@/database/user';
import CohortIcon from '@/scoreboard/CohortIcon';
import { ChessDojoIcon } from '@/style/ChessDojoIcon';
import { PawnIcon } from '@/style/ChessIcons';
import { RatingSystemIcon } from '@/style/RatingSystemIcons';
import {
    Directory,
    DirectoryItemTypes,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import {
    Assessment,
    PeopleAlt,
    Percent,
    Person,
    Remove,
    TimelineOutlined,
    TrendingDown,
    TrendingUp,
} from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Fade,
    LinearProgress,
    MenuItem,
    Stack,
    TextField,
    Typography,
    Zoom,
    alpha,
    useTheme,
} from '@mui/material';
import React, { useMemo, useState } from 'react';

interface StatsButtonProps {
    directoryId: string;
    directoryOwner: string;
    usercohort: string;
    directory: Directory;
}

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    color?: 'primary' | 'success' | 'error' | 'warning' | 'info' | 'white' | 'grey';
    icon?: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    subtitle,
    color = 'primary',
    icon,
    trend,
    delay = 0,
}) => {
    const theme = useTheme();

    const getTrendIcon = () => {
        switch (trend) {
            case 'up':
                return <TrendingUp fontSize='small' color='success' />;
            case 'down':
                return <TrendingDown fontSize='small' color='error' />;
            case 'neutral':
                return <Remove fontSize='small' color='disabled' />;
            default:
                return null;
        }
    };

    const getColorValue = (colorName: string) => {
        switch (colorName) {
            case 'success':
                return theme.palette.success.main;
            case 'error':
                return theme.palette.error.main;
            case 'warning':
                return theme.palette.warning.main;
            case 'info':
                return theme.palette.info.main;
            case 'white':
                return '#ffffff';
            case 'grey':
                return theme.palette.grey[600];
            default:
                return theme.palette.primary.main;
        }
    };

    return (
        <Zoom in timeout={300 + delay * 100}>
            <Card
                elevation={1}
                sx={{
                    height: '100%',
                    minHeight: 140,
                    flex: 1,
                    backgroundColor: alpha(getColorValue(color), color === 'white' ? 0.1 : 0.08),
                    border: `1px solid ${alpha(getColorValue(color), color === 'white' ? 0.3 : 0.2)}`,
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        elevation: 3,
                        backgroundColor: alpha(
                            getColorValue(color),
                            color === 'white' ? 0.15 : 0.12,
                        ),
                        border: `1px solid ${alpha(getColorValue(color), color === 'white' ? 0.4 : 0.3)}`,
                    },
                }}
            >
                <CardContent
                    sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                    }}
                >
                    <Stack spacing={2}>
                        <Stack direction='row' justifyContent='space-between' alignItems='center'>
                            <Stack direction='row' alignItems='center' spacing={1}>
                                {icon && <Box sx={{ color: getColorValue(color) }}>{icon}</Box>}
                                <Typography variant='body2' color='text.secondary' fontWeight={500}>
                                    {title}
                                </Typography>
                            </Stack>
                            {getTrendIcon()}
                        </Stack>

                        <Typography variant='h4' fontWeight='bold' color={getColorValue(color)}>
                            {value}
                        </Typography>

                        {subtitle && (
                            <Typography variant='caption' color='text.secondary'>
                                {subtitle}
                            </Typography>
                        )}
                    </Stack>
                </CardContent>
            </Card>
        </Zoom>
    );
};

interface WinRatioBarProps {
    wins: number;
    draws: number;
    losses: number;
    delay?: number;
}

const WinRatioBar: React.FC<WinRatioBarProps> = ({ wins, draws, losses, delay = 0 }) => {
    const theme = useTheme();
    const total = wins + draws + losses;

    if (total === 0) return null;

    const winPercent = (wins / total) * 100;
    const drawPercent = (draws / total) * 100;
    const lossPercent = (losses / total) * 100;

    return (
        <Fade in timeout={500 + delay * 100}>
            <Card elevation={1} sx={{ borderRadius: 2 }}>
                <CardContent>
                    <Stack spacing={3}>
                        <Box>
                            <Stack
                                direction='row'
                                sx={{ height: 24, borderRadius: 12, overflow: 'hidden' }}
                            >
                                <Box
                                    sx={{
                                        flex: winPercent,
                                        backgroundColor: theme.palette.success.main,
                                        transition: 'flex 1s ease-out',
                                    }}
                                />
                                <Box
                                    sx={{
                                        flex: drawPercent,
                                        backgroundColor: theme.palette.info.main,
                                        transition: 'flex 1s ease-out 0.2s',
                                    }}
                                />
                                <Box
                                    sx={{
                                        flex: lossPercent,
                                        backgroundColor: theme.palette.error.main,
                                        transition: 'flex 1s ease-out 0.4s',
                                    }}
                                />
                            </Stack>
                        </Box>

                        <Stack direction='row' spacing={3} justifyContent='center'>
                            <Stack alignItems='center' spacing={0.5}>
                                <Typography variant='h6' color='success.main' fontWeight='bold'>
                                    {winPercent.toFixed(1)}%
                                </Typography>
                                <Typography variant='body2' color='text.secondary'>
                                    Wins ({wins})
                                </Typography>
                            </Stack>
                            <Stack alignItems='center' spacing={0.5}>
                                <Typography variant='h6' color='info.main' fontWeight='bold'>
                                    {drawPercent.toFixed(1)}%
                                </Typography>
                                <Typography variant='body2' color='text.secondary'>
                                    Draws ({draws})
                                </Typography>
                            </Stack>
                            <Stack alignItems='center' spacing={0.5}>
                                <Typography variant='h6' color='error.main' fontWeight='bold'>
                                    {lossPercent.toFixed(1)}%
                                </Typography>
                                <Typography variant='body2' color='text.secondary'>
                                    Losses ({losses})
                                </Typography>
                            </Stack>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
        </Fade>
    );
};

export const StatsButton: React.FC<StatsButtonProps> = ({
    directoryId,
    directoryOwner,
    usercohort,
    directory,
}) => {
    const api = useApi();

    const [open, setOpen] = useState(false);
    const [playerName, setPlayerName] = useState('');
    const [ratingSystem, setRatingSystem] = useState(RatingSystem.Chesscom);
    const [stats, setStats] = useState<StatsApiResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const getRatingSystemName = (ratingSystem: RatingSystem) => {
        switch (ratingSystem) {
            case RatingSystem.Chesscom:
                return 'Chess.com';
            case RatingSystem.Lichess:
                return 'Lichess.org';
            default:
                return ratingSystem;
        }
    };

    // Create playerNameMap and sort players by game count
    const playerNameMap = useMemo(() => {
        const map: Map<string, number> = new Map();

        directory.itemIds.forEach((id) => {
            const currentItem = directory.items[id];

            if (currentItem.type !== DirectoryItemTypes.OWNED_GAME) {
                return;
            }

            const metaData = currentItem.metadata;

            map.set(metaData.black, (map.get(metaData.black) || 0) + 1);
            map.set(metaData.white, (map.get(metaData.white) || 0) + 1);
        });

        for (const [key, value] of map) {
            if (value < 2) {
                map.delete(key);
            }
        }

        return map;
    }, [directory]);

    const sortedPlayers = useMemo(() => {
        return Array.from(playerNameMap.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));
    }, [playerNameMap]);

    const handleOpen = () => {
        setStats(null);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setPlayerName('');
        setStats(null);
        setRatingSystem(RatingSystem.Chesscom);
    };

    const handleFetchStats = async () => {
        if (!playerName) return;
        setLoading(true);
        try {
            const result = await api.getDirectoryStats(
                directoryOwner,
                directoryId,
                playerName,
                ratingSystem,
                usercohort,
            );
            console.log('initial res', result.data);
            setStats(result.data);
            console.log('final', stats);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
            setStats(null);
        } finally {
            setLoading(false);
        }
    };

    const calculateWinDrawLoss = () => {
        if (!stats) return { wins: 0, draws: 0, losses: 0 };

        const winRatio = stats.performanceRating.winRatio || 0;
        const drawRatio = stats.performanceRating.drawRatio || 0;
        const lossRatio = stats.performanceRating.lossRatio || 0;

        const totalGames = Object.values(stats.performanceRating.cohortRatings || {}).reduce(
            (sum, cohort) => sum + cohort.gamesCount,
            0,
        );

        return {
            wins: Math.round((winRatio / 100) * totalGames),
            draws: Math.round((drawRatio / 100) * totalGames),
            losses: Math.round((lossRatio / 100) * totalGames),
        };
    };

    const renderCohortRatings = () => {
        if (!stats?.performanceRating?.cohortRatings) return null;

        const cohortItems: JSX.Element[] = [];
        const entries = Object.entries(stats.performanceRating.cohortRatings);

        entries.forEach(([cohortName, cohortData], index) => {
            cohortItems.push(
                <Zoom in timeout={300 + index * 100} key={cohortName}>
                    <Card
                        elevation={1}
                        sx={{
                            height: 140,
                            flex: 1,
                            borderRadius: 2,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                elevation: 3,
                            },
                        }}
                    >
                        <CardContent
                            sx={{
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Stack direction='row' alignItems='center' spacing={3}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 48,
                                        height: 48,
                                    }}
                                >
                                    <CohortIcon cohort={cohortName} />
                                </Box>

                                <Stack alignItems='center' spacing={0.5}>
                                    <Typography variant='h6' fontWeight='bold' textAlign='center'>
                                        {cohortName}
                                    </Typography>
                                    <Typography variant='caption' color='text.secondary'>
                                        Cohort
                                    </Typography>
                                </Stack>

                                <Stack alignItems='center' spacing={0.5}>
                                    <Typography variant='h6' fontWeight='bold' color='primary.main'>
                                        {cohortData.rating > 0
                                            ? Math.round(cohortData.rating)
                                            : 'N/A'}
                                    </Typography>
                                    <Typography variant='caption' color='text.secondary'>
                                        Rating
                                    </Typography>
                                </Stack>

                                <Stack alignItems='center' spacing={0.5}>
                                    <Typography variant='h6' fontWeight='bold' color='info.main'>
                                        {cohortData.gamesCount}
                                    </Typography>
                                    <Typography variant='caption' color='text.secondary'>
                                        Games
                                    </Typography>
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>
                </Zoom>,
            );
        });

        if (cohortItems.length === 0) return null;

        return (
            <Stack spacing={2}>
                <Typography variant='h6' fontWeight='bold'>
                    <Stack direction='row' alignItems='center' spacing={1}>
                        <PeopleAlt color='primary' />
                        <span>Cohort Performance Breakdown</span>
                    </Stack>
                </Typography>
                <Stack direction={{ xs: 'column', md: 'column' }} spacing={2}>
                    {cohortItems}
                </Stack>
            </Stack>
        );
    };

    const { wins, draws, losses } = calculateWinDrawLoss();

    return (
        <>
            <Button variant='contained' startIcon={<Assessment />} onClick={handleOpen}>
                Stats
            </Button>

            <Dialog open={open} onClose={handleClose} fullWidth maxWidth='lg'>
                <DialogTitle>
                    <Stack direction='row' alignItems='center' spacing={2}>
                        <Assessment color='primary' />
                        <Typography variant='h5' fontWeight='bold'>
                            Player Performance Analytics
                        </Typography>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={4} sx={{ mt: 1 }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                            <TextField
                                select
                                label='Select Player'
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                fullWidth
                                variant='outlined'
                                helperText={
                                    playerName
                                        ? `${playerNameMap.get(playerName)} games in directory`
                                        : 'Choose a player to analyze'
                                }
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                    },
                                }}
                            >
                                {sortedPlayers.map(({ name, count }) => (
                                    <MenuItem key={name} value={name}>
                                        <Stack
                                            direction='row'
                                            alignItems='center'
                                            spacing={2}
                                            width='100%'
                                        >
                                            <Person fontSize='small' />

                                            <Stack sx={{ flex: 1 }}>
                                                <Typography fontWeight={500}>{name}</Typography>
                                            </Stack>
                                            <Chip
                                                label={`${count} games`}
                                                size='small'
                                                color='primary'
                                                variant='outlined'
                                            />
                                        </Stack>
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                select
                                label='Rating System'
                                value={ratingSystem}
                                onChange={(e) => setRatingSystem(e.target.value as RatingSystem)}
                                fullWidth
                                variant='outlined'
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                    },
                                }}
                            >
                                {Object.values(RatingSystem)
                                    .slice(0, 8)
                                    .map((system) => (
                                        <MenuItem key={system} value={system}>
                                            <Stack direction='row' alignItems='center' spacing={2}>
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: 24,
                                                        height: 24,
                                                    }}
                                                >
                                                    <RatingSystemIcon
                                                        system={system}
                                                        size='small'
                                                    />
                                                </Box>
                                                <Typography fontWeight={500}>
                                                    {getRatingSystemName(system)}
                                                </Typography>
                                            </Stack>
                                        </MenuItem>
                                    ))}
                            </TextField>
                        </Stack>

                        <Button
                            variant='contained'
                            color='success'
                            onClick={handleFetchStats}
                            startIcon={<TimelineOutlined />}
                            disabled={loading || !playerName}
                            sx={{
                                py: 1.5,
                                borderRadius: 2,
                                fontWeight: 'bold',
                                textTransform: 'none',
                                fontSize: '1.1rem',
                            }}
                        >
                            {loading ? 'Analyzing...' : 'Generate Stats'}
                        </Button>

                        {loading && (
                            <Stack spacing={2}>
                                <LinearProgress
                                    sx={{
                                        borderRadius: 4,
                                        height: 6,
                                    }}
                                />
                                <Typography
                                    variant='body2'
                                    color='text.secondary'
                                    textAlign='center'
                                >
                                    Crunching the numbers...
                                </Typography>
                            </Stack>
                        )}

                        {stats && !loading && (
                            <Fade in timeout={500}>
                                <Stack spacing={4}>
                                    <Typography
                                        variant='h4'
                                        color='primary'
                                        fontWeight='bold'
                                        textAlign='center'
                                    >
                                        {playerName}'s Performance Stats
                                    </Typography>

                                    {/* Platform Performance Cards */}
                                    <Stack spacing={3}>
                                        <Typography variant='h6' fontWeight='bold'>
                                            <Stack direction='row' alignItems='center' spacing={1}>
                                                <RatingSystemIcon
                                                    system={ratingSystem}
                                                    size='medium'
                                                />
                                                <span>
                                                    {getRatingSystemName(ratingSystem)} Performance
                                                </span>
                                            </Stack>
                                        </Typography>
                                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                            <StatCard
                                                title='Combined Rating'
                                                value={
                                                    stats.performanceRating.combinedRating > 0
                                                        ? Math.round(
                                                              stats.performanceRating
                                                                  .combinedRating,
                                                          )
                                                        : 'N/A'
                                                }
                                                subtitle='Overall performance'
                                                color='success'
                                                icon={<Assessment />}
                                                delay={0}
                                            />
                                            <StatCard
                                                title='As White'
                                                value={
                                                    stats.performanceRating.whiteRating > 0
                                                        ? Math.round(
                                                              stats.performanceRating.whiteRating,
                                                          )
                                                        : 'N/A'
                                                }
                                                subtitle='White pieces'
                                                color='primary'
                                                icon={<PawnIcon />}
                                                delay={1}
                                            />
                                            <StatCard
                                                title='As Black'
                                                value={
                                                    stats.performanceRating.blackRating > 0
                                                        ? Math.round(
                                                              stats.performanceRating.blackRating,
                                                          )
                                                        : 'N/A'
                                                }
                                                subtitle='Black pieces'
                                                color='primary'
                                                icon={<PawnIcon />}
                                                delay={2}
                                            />
                                        </Stack>
                                    </Stack>

                                    {/* Dojo Performance Cards */}
                                    <Stack spacing={3}>
                                        <Typography variant='h6' fontWeight='bold'>
                                            <Stack direction='row' alignItems='center' spacing={1}>
                                                <ChessDojoIcon />
                                                <span>Dojo Cohort Performance</span>
                                            </Stack>
                                        </Typography>
                                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                            <StatCard
                                                title='Combined Rating'
                                                value={
                                                    stats.performanceRating
                                                        .normalizedCombinedRating > 0
                                                        ? Math.round(
                                                              stats.performanceRating
                                                                  .normalizedCombinedRating,
                                                          )
                                                        : 'N/A'
                                                }
                                                subtitle='Normalized overall'
                                                color='success'
                                                icon={<Assessment />}
                                                delay={0}
                                            />
                                            <StatCard
                                                title='As White'
                                                value={
                                                    stats.performanceRating.normalizedWhiteRating >
                                                    0
                                                        ? Math.round(
                                                              stats.performanceRating
                                                                  .normalizedWhiteRating,
                                                          )
                                                        : 'N/A'
                                                }
                                                subtitle='Normalized white'
                                                color='primary'
                                                icon={<PawnIcon />}
                                                delay={1}
                                            />
                                            <StatCard
                                                title='As Black'
                                                value={
                                                    stats.performanceRating.normalizedBlackRating >
                                                    0
                                                        ? Math.round(
                                                              stats.performanceRating
                                                                  .normalizedBlackRating,
                                                          )
                                                        : 'N/A'
                                                }
                                                subtitle='Normalized black'
                                                color='primary'
                                                icon={<PawnIcon />}
                                                delay={2}
                                            />
                                        </Stack>
                                    </Stack>

                                    <Stack spacing={2}>
                                        {/* Win/Draw/Loss Visualization */}
                                        <Typography variant='h6' fontWeight='bold'>
                                            <Stack direction='row' alignItems='center' spacing={1}>
                                                <Percent color='primary' />
                                                <span>Result Percent</span>
                                            </Stack>
                                        </Typography>
                                        <WinRatioBar
                                            wins={wins}
                                            draws={draws}
                                            losses={losses}
                                            delay={1}
                                        />
                                    </Stack>

                                    {/* Cohort Breakdown */}
                                    {renderCohortRatings()}
                                </Stack>
                            </Fade>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button
                        onClick={handleClose}
                        variant='outlined'
                        sx={{
                            borderRadius: 2,
                            fontWeight: 500,
                            textTransform: 'none',
                        }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
