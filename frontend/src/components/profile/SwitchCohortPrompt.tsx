import { useAuth } from '@/auth/Auth';
import {
    getCurrentRating,
    shouldPromptDemotion,
    shouldPromptGraduation,
} from '@/database/user';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Alert, Button, Snackbar } from '@mui/material';
import { useEffect, useState } from 'react';

export function SwitchCohortPrompt() {
    const { user } = useAuth();

    const [showGraduation, setShowGraduation] = useState(false);
    const [showDemotion, setShowDemotion] = useState(false);

    const [hideGraduation, setHideGraduation] = useState(false);
    const [hideDemotion, setHideDemotion] = useState(false);

    useEffect(() => {
        setShowGraduation(shouldPromptGraduation(user));
        setShowDemotion(shouldPromptDemotion(user));
    }, [user, setShowGraduation, setShowDemotion]);

    return (
        <Snackbar
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            open={(showGraduation && !hideGraduation) || (showDemotion && !hideDemotion)}
            onClose={
                showGraduation
                    ? () => setHideGraduation(true)
                    : () => setHideDemotion(true)
            }
            autoHideDuration={showGraduation ? 6000 : 7000}
        >
            <Alert
                variant='filled'
                severity={showGraduation ? 'success' : 'error'}
                action={
                    showDemotion && (
                        <Button
                            color='inherit'
                            size='small'
                            href='/profile/edit'
                            endIcon={<NavigateNextIcon />}
                        >
                            Settings
                        </Button>
                    )
                }
                sx={{ width: 1 }}
            >
                {showGraduation
                    ? `Congrats on reaching ${getCurrentRating(
                          user,
                      )}! Click the graduate button at the top of your profile to move to the next cohort!`
                    : `Your rating has been less than your cohort's minimum rating for 90 days. We recommend moving down a cohort in your settings.`}
            </Alert>
        </Snackbar>
    );
}
