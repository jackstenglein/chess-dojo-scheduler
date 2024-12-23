import { useAuth } from '@/auth/Auth';
import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { registerUser } from './roundRobinApi';

export interface RegisterModalProps {
    open: boolean;
    onClose: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ open, onClose }) => {
    const { user } = useAuth();

    if (!user) {
        return null;
    }

    const [lichessName, setLichessName] = useState(user.ratings.LICHESS?.username || '');
    const [discordName, setDiscordName] = useState(user.discordUsername || '');
    const [chessComName, setChessComName] = useState(
        user.ratings.CHESSCOM?.username || '',
    );
    const [loading, setLoading] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const message = await registerUser(
                parseInt(user.dojoCohort),
                discordName,
                discordName,
                lichessName,
                chessComName,
                user.displayName,
            );
            setFeedbackMessage(message);
        } catch (error) {
            setFeedbackMessage('An error occurred while registering. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFeedbackMessage(null);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>
                {feedbackMessage
                    ? 'Registration Feedback'
                    : 'Register for Dojo Round Robin'}
            </DialogTitle>
            <DialogContent>
                {loading ? (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '150px',
                        }}
                    >
                        <CircularProgress />
                    </div>
                ) : feedbackMessage ? (
                    <Typography>{feedbackMessage}</Typography>
                ) : (
                    <>
                        <TextField
                            fullWidth
                            margin='normal'
                            label='Lichess Name'
                            value={lichessName}
                            onChange={(e) => setLichessName(e.target.value)}
                        />
                        <TextField
                            fullWidth
                            margin='normal'
                            label='Discord Name'
                            value={discordName}
                            onChange={(e) => setDiscordName(e.target.value)}
                        />
                        <TextField
                            fullWidth
                            margin='normal'
                            label='Chess.com Name'
                            value={chessComName}
                            onChange={(e) => setChessComName(e.target.value)}
                        />
                    </>
                )}
            </DialogContent>
            <DialogActions>
                {!loading && (
                    <>
                        {feedbackMessage ? (
                            <Button onClick={handleClose} color='primary'>
                                Close
                            </Button>
                        ) : (
                            <>
                                <Button onClick={onClose} color='warning'>
                                    Cancel
                                </Button>
                                <Button onClick={handleSubmit} color='success'>
                                    Submit
                                </Button>
                            </>
                        )}
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default RegisterModal;
