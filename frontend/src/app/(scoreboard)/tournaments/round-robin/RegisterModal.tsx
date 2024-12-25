import { User } from '@/database/user';
import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    InputAdornment,
    styled,
    TextField,
    Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { SiChessdotcom, SiDiscord, SiLichess } from 'react-icons/si'; // Importing react-icons
import { registerUser } from './roundRobinApi';

export interface RegisterModalProps {
    open: boolean;
    onClose: () => void;
    user: User;
}


const StyledDialog = styled(Dialog)(() => ({
    '& .MuiPaper-root': {
        backgroundColor: 'black',
    },
}));

const RegisterModal: React.FC<RegisterModalProps> = ({ open, onClose, user }) => {
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
        <StyledDialog open={open} onClose={handleClose}>
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
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position='start'>
                                        <SiLichess fontSize={25} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            fullWidth
                            margin='normal'
                            label='Discord Name'
                            value={discordName}
                            onChange={(e) => setDiscordName(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position='start'>
                                        <SiDiscord
                                            fontSize={25}
                                            style={{ color: '#5865f2' }}
                                        />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            fullWidth
                            margin='normal'
                            label='Chess.com Name'
                            value={chessComName}
                            onChange={(e) => setChessComName(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position='start'>
                                        <SiChessdotcom
                                            fontSize={25}
                                            style={{ color: '#81b64c' }}
                                        />
                                    </InputAdornment>
                                ),
                            }}
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
        </StyledDialog>
    );
};

export default RegisterModal;
