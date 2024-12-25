import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { withdrawUser } from './roundRobinApi';

import { RegisterModalProps } from './RegisterModal';

interface WithdrawModalProps extends RegisterModalProps {
    waiting: boolean;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({
    open,
    onClose,
    user,
    waiting,
}) => {
    if (!user) {
        return null;
    }

    const [loading, setLoading] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const message = await withdrawUser(user.displayName, user.displayName);
            setFeedbackMessage(message);
        } catch (error) {
            setFeedbackMessage('An error occurred while withdrawing. Please try again.');
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
                    ? 'Withdrawal Feedback'
                    : 'Withdraw from Round Robin Tournament'}
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
                    <Typography variant='body1' gutterBottom>
                        {waiting
                            ? 'Are you sure you want to withdraw? You would not be able to join back if this one becomes active again!'
                            : 'Are you sure you want to withdraw? If you withdraw, all opponents you played will get 1 point win, and your old game scores would not count'}
                    </Typography>
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
                                    No
                                </Button>
                                <Button onClick={handleSubmit} color='success'>
                                    Yes
                                </Button>
                            </>
                        )}
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default WithdrawModal;
