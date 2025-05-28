'use client';

import { useApi } from '@/api/Api';
import { StatsApiResponse } from '@/api/directoryApi';
import { RatingSystem } from '@/database/user';
import {
    Directory,
    DirectoryItemTypes,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { TimelineOutlined } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import React, { useMemo, useState } from 'react';

interface StatsButtonProps {
    directoryId: string;
    directoryOwner: string;
    usercohort: string;
    directory: Directory;
}

interface CohortRatingMetric {
    rating: number;
    oppRatings: number[];
    gamesCount: number;
    ratios: number[];
}

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

        for(const [key, value] of map){
            if(value < 2){
                map.delete(key);
            }
        }

        return map;
    }, [directory]);

    // Get sorted list of players by game count (descending)
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

    const renderCohortRatings = () => {
        if (!stats?.performanceRating?.cohortRatings) return null;

        const cohortItems: JSX.Element[] = [];
        const entries = Object.entries(stats.performanceRating.cohortRatings);

        console.log(entries);

        entries.forEach(([cohortName, cohortData]) => {
            cohortItems.push(
                <Accordion key={cohortName} variant='outlined'>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box display='flex' alignItems='center' gap={2} width='100%'>
                            <Typography variant='body1' fontWeight='medium'>
                                {cohortName}
                            </Typography>
                            <Chip
                                label={`${cohortData.gamesCount} games`}
                                size='small'
                                variant='outlined'
                            />
                            <Typography variant='body2' color='primary' fontWeight='bold'>
                                {cohortData.rating > 0 ? Math.round(cohortData.rating) : 'N/A'}
                            </Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Stack spacing={2}>
                            <Box>
                                <Typography variant='body2' color='text.secondary'>
                                    Performance Rating:{' '}
                                    <strong>
                                        {cohortData.rating > 0
                                            ? Math.round(cohortData.rating)
                                            : 'N/A'}
                                    </strong>
                                </Typography>
                                <Typography variant='body2' color='text.secondary'>
                                    Games Played: <strong>{cohortData.gamesCount}</strong>
                                </Typography>
                            </Box>
                        </Stack>
                    </AccordionDetails>
                </Accordion>,
            );
        });

        if (cohortItems.length === 0) return null;

        return (
            <Box>
                <Typography variant='subtitle2' color='text.secondary' gutterBottom>
                    Cohort Performance Breakdown
                </Typography>
                <Stack spacing={1}>{cohortItems}</Stack>
            </Box>
        );
    };

    return (
        <>
            <Button variant='contained' startIcon={<TimelineOutlined />} onClick={handleOpen}>
                Stats
            </Button>

            <Dialog open={open} onClose={handleClose} fullWidth maxWidth='md'>
                <DialogTitle>Player Stats</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <TextField
                            select
                            label='Select Player'
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            fullWidth
                            helperText={
                                playerName
                                    ? `${playerNameMap.get(playerName)} games in directory`
                                    : 'Select a player from the directory'
                            }
                        >
                            {sortedPlayers.map(({ name, count }) => (
                                <MenuItem key={name} value={name}>
                                    <Box display='flex' justifyContent='space-between' width='100%'>
                                        <Typography>{name}</Typography>
                                        <Chip
                                            label={`${count} games`}
                                            size='small'
                                            variant='outlined'
                                        />
                                    </Box>
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            label='Rating System'
                            value={ratingSystem}
                            onChange={(e) => setRatingSystem(e.target.value as RatingSystem)}
                            fullWidth
                        >
                            {Object.values(RatingSystem)
                                .slice(0, 8)
                                .map((system) => (
                                    <MenuItem key={system} value={system}>
                                        {system}
                                    </MenuItem>
                                ))}
                        </TextField>

                        <Button
                            variant='contained'
                            onClick={handleFetchStats}
                            disabled={loading || !playerName}
                        >
                            {loading ? 'Loading...' : 'Get Stats'}
                        </Button>

                        {stats && !loading && (
                            <Paper
                                elevation={2}
                                sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2 }}
                            >
                                <Typography variant='h6' gutterBottom color='primary'>
                                    Performance Metrics for {playerName}
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                <Stack spacing={2}>
                                    <Box>
                                        <Typography variant='subtitle2' color='text.secondary'>
                                            {ratingSystem} Rating Performance
                                        </Typography>
                                        <Stack direction='row' spacing={3} mt={1}>
                                            <Box>
                                                <Typography variant='body2' color='text.secondary'>
                                                    Combined
                                                </Typography>
                                                <Typography variant='h6'>
                                                    {stats.performanceRating.combinedRating > 0
                                                        ? Math.round(
                                                              stats.performanceRating
                                                                  .combinedRating,
                                                          )
                                                        : 'N/A'}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant='body2' color='text.secondary'>
                                                    As White
                                                </Typography>
                                                <Typography variant='h6'>
                                                    {stats.performanceRating.whiteRating > 0
                                                        ? Math.round(
                                                              stats.performanceRating.whiteRating,
                                                          )
                                                        : 'N/A'}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant='body2' color='text.secondary'>
                                                    As Black
                                                </Typography>
                                                <Typography variant='h6'>
                                                    {stats.performanceRating.blackRating > 0
                                                        ? Math.round(
                                                              stats.performanceRating.blackRating,
                                                          )
                                                        : 'N/A'}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Box>

                                    <Divider />

                                    <Box>
                                        <Typography variant='subtitle2' color='text.secondary'>
                                            Dojo Cohort Rating Performance
                                        </Typography>
                                        <Stack direction='row' spacing={3} mt={1}>
                                            <Box>
                                                <Typography variant='body2' color='text.secondary'>
                                                    Combined
                                                </Typography>
                                                <Typography variant='h6'>
                                                    {stats.performanceRating
                                                        .normalizedCombinedRating > 0
                                                        ? Math.round(
                                                              stats.performanceRating
                                                                  .normalizedCombinedRating,
                                                          )
                                                        : 'N/A'}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant='body2' color='text.secondary'>
                                                    As White
                                                </Typography>
                                                <Typography variant='h6'>
                                                    {stats.performanceRating.normalizedWhiteRating >
                                                    0
                                                        ? Math.round(
                                                              stats.performanceRating
                                                                  .normalizedWhiteRating,
                                                          )
                                                        : 'N/A'}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant='body2' color='text.secondary'>
                                                    As Black
                                                </Typography>
                                                <Typography variant='h6'>
                                                    {stats.performanceRating.normalizedBlackRating >
                                                    0
                                                        ? Math.round(
                                                              stats.performanceRating
                                                                  .normalizedBlackRating,
                                                          )
                                                        : 'N/A'}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Box>

                                    <Divider />

                                    <Box>
                                        <Typography variant='subtitle2' color='text.secondary'>
                                            Win/Draw/Loss Ratio
                                        </Typography>
                                        <Stack direction='row' spacing={3} mt={1}>
                                            <Box>
                                                <Typography variant='body2' color='text.secondary'>
                                                    Wins
                                                </Typography>
                                                <Typography variant='h6' color='success.main'>
                                                    {stats.performanceRating.winRatio !== undefined
                                                        ? stats.performanceRating.winRatio
                                                        : 'N/A'}
                                                    %
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant='body2' color='text.secondary'>
                                                    Draws
                                                </Typography>
                                                <Typography variant='h6' color='info.main'>
                                                    {stats.performanceRating.drawRatio !== undefined
                                                        ? stats.performanceRating.drawRatio
                                                        : 'N/A'}
                                                    %
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant='body2' color='text.secondary'>
                                                    Losses
                                                </Typography>
                                                <Typography variant='h6' color='error.main'>
                                                    {stats.performanceRating.lossRatio !== undefined
                                                        ? stats.performanceRating.lossRatio
                                                        : 'N/A'}
                                                    %
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Box>

                                    <Divider />

                                    {renderCohortRatings()}
                                </Stack>
                            </Paper>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color='secondary'>
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
