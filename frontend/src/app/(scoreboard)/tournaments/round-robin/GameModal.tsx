import { useAuth } from '@/auth/Auth';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { RegisterModalProps } from './RegisterModal';
import { submitGameFromUser } from './roundRobinApi';

const GameModal: React.FC<RegisterModalProps> = ({ open, onClose }) => {
    const { user } = useAuth();

    if (!user) {
        return;
    }
    const [gameURL, setGameURL] = useState('');

    const handleSubmit = async () => {
        try {
            const message = await submitGameFromUser(
                user.discordUsername,
                user.displayName,
                gameURL,
            );
            alert(message);
            onClose();
        } catch (error) {
            alert('An error occurred while registering. Please try again.');
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Submit Your Round Robin Game </DialogTitle>
            <DialogContent>
                <Typography variant='body1' gutterBottom>
                    Input your Lichess.org or Chess.com game URL, this game submission is optional.
                </Typography>
                <TextField
                    fullWidth
                    margin='normal'
                    label='Game URL'
                    value={gameURL}
                    onChange={(e) => setGameURL(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color='warning'>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} color='success'>
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default GameModal;
