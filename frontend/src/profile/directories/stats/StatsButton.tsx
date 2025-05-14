'use client';

import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import { RatingSystem } from '@/database/user';
import { useApi } from '@/api/Api';
import { PerformanceRatingMetric } from '@/api/directoryApi';


interface StatsButtonProps {
  directoryId: string;
  directoryOwner: string;
  usercohort: string;
}

export const StatsButton: React.FC<StatsButtonProps> = ({
  directoryId,
  directoryOwner,
  usercohort
}) => {
  const api = useApi();
  
  const [open, setOpen] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [ratingSystem, setRatingSystem] = useState(RatingSystem.Chesscom);
  const [stats, setStats] = useState<PerformanceRatingMetric | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpen = () => {
    setOpen(true);
    setStats(null);
  };

  const handleClose = () => {
    setOpen(false);
    setPlayerName('');
    setRatingSystem(RatingSystem.Chesscom);
    setStats(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await api.getDirectoryStats(
        directoryOwner,
        directoryId,
        playerName,
        ratingSystem,
        usercohort,
      );
      setStats(result.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outlined" onClick={handleOpen}>
        View Stats
      </Button>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Player Stats</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Player Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              fullWidth
            />
            <TextField
              select
              label="Rating System"
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

            {stats && (
              <Stack spacing={1}>
                <Typography variant="h6">Performance Metrics</Typography>
                {Object.entries(stats).map(([key, value]) => (
                  <Typography key={key}>
                    <strong>{key}:</strong> {value}
                  </Typography>
                ))}
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading || !playerName}>
            {loading ? 'Loading...' : 'Get Stats'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
