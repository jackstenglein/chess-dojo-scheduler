import { Alert, Button, Snackbar } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/Auth';
import { getCurrentRating, shouldPromptGraduation } from '../database/user';

export function GraduationPrompt() {
    const user = useAuth().user;
    const navigate = useNavigate();
    const [showPrompt, setShowPrompt] = useState(false);
    const [promptHidden, setPromptHidden] = useState(false);

    useEffect(() => {
        const promptGraduation = shouldPromptGraduation(user);
        if (promptGraduation) {
            setShowPrompt(true);
        }
    }, [user, setShowPrompt]);

    return (
        <>
            <Outlet />
            <Snackbar
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                open={showPrompt && !promptHidden}
                onClose={() => setPromptHidden(true)}
                autoHideDuration={6000}
            >
                <Alert
                    severity='success'
                    action={
                        <Button
                            color='inherit'
                            size='small'
                            onClick={() => navigate('/profile')}
                            endIcon={<NavigateNextIcon />}
                        >
                            Profile
                        </Button>
                    }
                    sx={{ width: 1 }}
                >
                    Congrats on reaching {getCurrentRating(user)}! Go to your profile to
                    officially graduate!
                </Alert>
            </Snackbar>
        </>
    );
}
