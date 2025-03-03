import { useApi } from '@/api/Api';
import { useAuth } from '@/auth/Auth';
import {
    getCurrentRating,
    getPartialUserHideCohortPrompt,
    isCohortPromptHidden,
    shouldPromptDemotion,
    shouldPromptGraduation,
} from '@/database/user';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Alert, Button, Snackbar, Stack } from '@mui/material';
import { useEffect, useState } from 'react';

export function SwitchCohortPrompt() {
    const { user } = useAuth();
    const api = useApi();

    const [showGraduation, setShowGraduation] = useState(false);
    const [open, setOpen] = useState(false);
    const [forceClose, setForceClose] = useState(false);

    useEffect(() => {
        if (forceClose) {
            return;
        }

        const userHasHiddenCohortPrompt = isCohortPromptHidden(user);
        if (userHasHiddenCohortPrompt) {
            setOpen(false);
            return;
        }

        const promptGraudation = shouldPromptGraduation(user);
        if (promptGraudation) {
            setShowGraduation(true);
            setOpen(true);
            return;
        }

        const promptDemotion = shouldPromptDemotion(user);
        if (promptDemotion) {
            setShowGraduation(false);
            setOpen(true);
            return;
        }

        setOpen(false);
    }, [user, forceClose]);

    const handleHideCohortPrompt = () => {
        const partialUser = getPartialUserHideCohortPrompt(user);
        void api.updateUser(partialUser);
        handleClose();
    };

    const handleClose = () => {
        setOpen(false);
        setForceClose(true);
    };

    return (
        <Snackbar
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            open={open}
            onClose={handleClose}
            autoHideDuration={showGraduation ? 6000 : 7000}
        >
            <Alert
                variant='filled'
                severity={showGraduation ? 'success' : 'error'}
                action={
                    <Stack direction='row'>
                        <Button
                            color='inherit'
                            size='small'
                            onClick={handleHideCohortPrompt}
                        >
                            Hide for 1 month
                        </Button>
                        {!showGraduation && (
                            <Button
                                color='inherit'
                                size='small'
                                href='/profile/edit'
                                sx={{ ml: 2, px: 3 }}
                                endIcon={<NavigateNextIcon />}
                            >
                                Settings
                            </Button>
                        )}
                    </Stack>
                }
                sx={{ width: 1 }}
            >
                {showGraduation
                    ? `${
                          user?.enableZenMode
                              ? `It's time to graduate!`
                              : `Congrats on reaching ${getCurrentRating(user)}!`
                      } Click the graduate button at the top of your profile to move to the next cohort!`
                    : `Your rating has been less than your cohort's minimum rating for 90 days. We recommend moving down a cohort in your settings.`}
            </Alert>
        </Snackbar>
    );
}
