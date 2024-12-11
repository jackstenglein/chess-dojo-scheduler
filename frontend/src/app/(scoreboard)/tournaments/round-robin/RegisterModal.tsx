import React, { useState } from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    TextField,
    Typography,
} from '@mui/material';
import { registerUser } from './roundRobinApi'; 
import { useAuth } from '@/auth/Auth';

export interface RegisterModalProps {
    open: boolean;
    onClose: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({
    open,
    onClose,
}) => {
    const { user } = useAuth();

    if(!user){
        return;
    }
    const [lichessName, setLichessName] = useState(user.ratings.LICHESS?.username || '');
    const [discordName, setDiscordName] = useState(user.discordUsername || '');
    const [chessComName, setChessComName] = useState(user.ratings.CHESSCOM?.username || '');

    const handleSubmit = async () => {
        try {
            const message = await registerUser(
                parseInt(user.dojoCohort),
                discordName,
                discordName, // can't really get discord id currently so passing in Discordname
                lichessName,
                chessComName,
                user.displayName
            );
            alert(message);
            onClose();
        } catch (error) {
            alert('An error occurred while registering. Please try again.');
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Register for Dojo Round Robin</DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth
                    margin="normal"
                    label="Lichess Name"
                    value={lichessName}
                    onChange={(e) => setLichessName(e.target.value)}
                />
                <TextField
                    fullWidth
                    margin="normal"
                    label="Discord Name"
                    value={discordName}
                    onChange={(e) => setDiscordName(e.target.value)}
                />
                <TextField
                    fullWidth
                    margin="normal"
                    label="Chess.com Name"
                    value={chessComName}
                    onChange={(e) => setChessComName(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="warning">
                    Cancel
                </Button>
                <Button onClick={handleSubmit} color="success">
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RegisterModal;
