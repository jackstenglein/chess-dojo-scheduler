'use client';

import { useApi } from '@/api/Api';
import { StatsApiResponse } from '@/api/directoryApi';
import { RatingSystem } from '@/database/user';
import {
    Box,
    Button,
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
import React, { useState } from 'react';

interface StatsButtonProps {
    directoryId: string;
    directoryOwner: string;
    usercohort: string;
}

export const StatsButton: React.FC<StatsButtonProps> = ({
    directoryId,
    directoryOwner,
    usercohort,
}) => {
    const api = useApi();

    const [open, setOpen] = useState(false);
    const [playerName, setPlayerName] = useState('');
    const [ratingSystem, setRatingSystem] = useState(RatingSystem.Chesscom);
    const [stats, setStats] = useState<StatsApiResponse | null>(null);
    const [loading, setLoading] = useState(false);

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

    const getCohortDisplayLevel = (level: string): string => {
        const currentCohort = parseInt(usercohort.split('-')[0]);
        const nextCohort = parseInt(usercohort.split('-')[1]);
        switch (level) {
            case 'next':
                return `${currentCohort + 100}-${nextCohort + 100}`;
            case 'nextnext':
                return `${currentCohort + 200}-${nextCohort + 200}`;
            case 'pre':
                return `${currentCohort - 100}-${nextCohort - 100}`;
            case 'prepre':
                return `${currentCohort - 200}-${nextCohort - 200}`;
        }

        return level;
    };

    return (
        <>
            <Button variant='outlined' onClick={handleOpen}>
                View Stats
            </Button>

            <Dialog open={open} onClose={handleClose} fullWidth maxWidth='sm'>
                <DialogTitle>Player Stats</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <TextField
                            label='Player Name'
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            fullWidth
                        />
                        <TextField
                            select
                            label='Rating System'
                            value={ratingSystem}
                            onChange={(e) => setRatingSystem(e.target.value as RatingSystem)}
                            fullWidth
                        >
                            {Object.values(RatingSystem).map((system) => (
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
                                                        ? stats.performanceRating.combinedRating
                                                        : 'N/A'}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant='body2' color='text.secondary'>
                                                    As White
                                                </Typography>
                                                <Typography variant='h6'>
                                                    {stats.performanceRating.whiteRating > 0
                                                        ? stats.performanceRating.whiteRating
                                                        : 'N/A'}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant='body2' color='text.secondary'>
                                                    As Black
                                                </Typography>
                                                <Typography variant='h6'>
                                                    {stats.performanceRating.blackRating > 0
                                                        ? stats.performanceRating.blackRating
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
                                            Vs Cohorts Rating Performance
                                        </Typography>
                                        <Stack direction='row' spacing={3} mt={1}>
                                            <Box>
                                                <Typography variant='body2' color='text.secondary'>
                                                    {getCohortDisplayLevel('prepre')}
                                                </Typography>
                                                <Typography variant='h6'>
                                                    {stats.performanceRating
                                                        .prePreviousCohortRating !== undefined &&
                                                    stats.performanceRating
                                                        .prePreviousCohortRating > 0
                                                        ? stats.performanceRating
                                                              .prePreviousCohortRating
                                                        : 'N/A'}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant='body2' color='text.secondary'>
                                                    {getCohortDisplayLevel('pre')}
                                                </Typography>
                                                <Typography variant='h6'>
                                                    {stats.performanceRating
                                                        .previousCohortRating !== undefined &&
                                                    stats.performanceRating.previousCohortRating > 0
                                                        ? stats.performanceRating
                                                              .previousCohortRating
                                                        : 'N/A'}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant='body2' color='text.secondary'>
                                                    {getCohortDisplayLevel('next')}
                                                </Typography>
                                                <Typography variant='h6'>
                                                    {stats.performanceRating.nextCohortRating !==
                                                        undefined &&
                                                    stats.performanceRating.nextCohortRating > 0
                                                        ? stats.performanceRating.nextCohortRating
                                                        : 'N/A'}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant='body2' color='text.secondary'>
                                                    {getCohortDisplayLevel('nextnext')}
                                                </Typography>
                                                <Typography variant='h6'>
                                                    {stats.performanceRating
                                                        .nextNextCohortRating !== undefined &&
                                                    stats.performanceRating.nextNextCohortRating > 0
                                                        ? stats.performanceRating
                                                              .nextNextCohortRating
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
                                                        ? Math.round(
                                                              stats.performanceRating.winRatio *
                                                                  100,
                                                          )
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
                                                        ? Math.round(
                                                              stats.performanceRating.drawRatio *
                                                                  100,
                                                          )
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
                                                        ? Math.round(
                                                              stats.performanceRating.lossRatio *
                                                                  100,
                                                          )
                                                        : 'N/A'}
                                                    %
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </Box>
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
