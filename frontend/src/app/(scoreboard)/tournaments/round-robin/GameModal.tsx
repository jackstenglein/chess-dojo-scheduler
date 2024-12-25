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
import { RegisterModalProps } from './RegisterModal';
import { submitGameFromUser } from './roundRobinApi';

const GameModal: React.FC<RegisterModalProps> = ({ open, onClose, user }) => {
    if (!user) {
        return null;
    }

    const [gameURL, setGameURL] = useState('');
    const [loading, setLoading] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const message = await submitGameFromUser(
                user.discordUsername,
                user.displayName,
                gameURL,
            );
            setFeedbackMessage(message);
        } catch (error) {
            setFeedbackMessage(
                'An error occurred while submitting the game. Please try again, make sure the game you submitted you actually played',
            );
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
                {feedbackMessage ? 'Submission Feedback' : 'Submit Your Round Robin Game'}
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
                    <Typography variant='body1'>{feedbackMessage}</Typography>
                ) : (
                    <>
                        <Typography variant='body1' gutterBottom>
                            Input your Lichess.org or Chess.com game URL.
                        </Typography>
                        <TextField
                            fullWidth
                            margin='normal'
                            label='Game URL'
                            value={gameURL}
                            onChange={(e) => setGameURL(e.target.value)}
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

export default GameModal;
