import { useAuth } from '@/auth/Auth';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
} from '@mui/material';
import React from 'react';
import { withdrawUser } from './roundRobinApi';

import { RegisterModalProps } from './RegisterModal';

const WithdrawModal: React.FC<RegisterModalProps> = ({ open, onClose }) => {
    const { user } = useAuth();

    if (!user) {
        return;
    }

    const handleSubmit = async () => {
        try {
            const message = await withdrawUser(user.displayName, user.displayName);
            alert(message);
            onClose();
        } catch (error) {
            alert('An error occurred while withdrawing. Please try again.');
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Withdraw from Round Robin tournament</DialogTitle>
            <DialogContent>
                <Typography variant='body1' gutterBottom>
                    Are you sure you sure you want to withdraw? If you withdraw all
                    opponents you played will get 1 point win, and your old games scores
                    won't count
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color='warning'>
                    No
                </Button>
                <Button onClick={handleSubmit} color='success'>
                    Yes
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default WithdrawModal;
