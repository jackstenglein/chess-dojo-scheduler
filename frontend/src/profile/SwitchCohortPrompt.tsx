import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Link,
    Snackbar,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { LoadingButton } from '@mui/lab';
import { useAuth } from '../auth/Auth';
import {
    getCurrentRating,
    getSuggestedCohorts,
    shouldPromptDemotion,
    shouldPromptGraduation,
} from '../database/user';

export function SwitchCohortPrompt() {
    const user = useAuth().user;
    const navigate = useNavigate();
    const api = useApi();
    const request = useRequest();

    const location = useLocation().pathname;

    const [oldCohort, newCohort] = getSuggestedCohorts(user);
    const [showSwitchCohorts, setShowSwitchCohorts] = useState(false);

    const [showGraduation, setShowGraduation] = useState(false);
    const [showDemotion, setShowDemotion] = useState(false);

    const [hideGraduation, setHideGraduation] = useState(false);
    const [hideDemotion, setHideDemotion] = useState(false);

    useEffect(() => {
        if (oldCohort !== newCohort && user && user.dojoCohort !== newCohort) {
            setShowSwitchCohorts(location === '/profile');
        } else {
            setShowGraduation(shouldPromptGraduation(user));
            setShowDemotion(shouldPromptDemotion(user));
        }
    }, [
        user,
        oldCohort,
        newCohort,
        location,
        setShowSwitchCohorts,
        setShowGraduation,
        setShowDemotion,
    ]);

    const onSwitchCohorts = () => {
        request.onStart();
        api.updateUser({ dojoCohort: newCohort })
            .then(() => {
                request.onSuccess();
                setShowSwitchCohorts(false);
            })
            .catch((err) => {
                console.error('updateUser: ', err);
                request.onFailure(err);
            });
    };

    return (
        <>
            <Outlet />
            {!showSwitchCohorts && (
                <Snackbar
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    open={
                        (showGraduation && !hideGraduation) ||
                        (showDemotion && !hideDemotion)
                    }
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
                            showGraduation ? (
                                <Button
                                    color='inherit'
                                    size='small'
                                    onClick={() => navigate('/profile')}
                                    endIcon={<NavigateNextIcon />}
                                >
                                    Profile
                                </Button>
                            ) : (
                                <Button
                                    color='inherit'
                                    size='small'
                                    onClick={() => navigate('/profile/edit')}
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
                              )}! Go to your profile to
                    officially graduate!`
                            : `Your rating has been less than your cohort's minimum rating for 90 days. We recommend moving down a cohort in your settings.`}
                    </Alert>
                </Snackbar>
            )}

            {showSwitchCohorts && (
                <Dialog
                    open={true}
                    onClose={
                        request.isLoading()
                            ? undefined
                            : () => setShowSwitchCohorts(false)
                    }
                >
                    <DialogTitle>New Cohorts Released</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            The Dojo has recalculated the cohort ranges for all rating
                            systems. As a result, we strongly suggest changing your cohort
                            from <strong>{oldCohort}</strong> to{' '}
                            <strong>{newCohort}</strong>. This will place you with
                            sparring partners more similar in strength and give you
                            training material better suited to your level.
                            <br />
                            You can find more information on our{' '}
                            <Link href='/blog/new-ratings' target='_blank'>
                                blog
                            </Link>{' '}
                            or in the FAQs on our{' '}
                            <Link href='/help' target='_blank'>
                                help page
                            </Link>
                            .
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <LoadingButton
                            loading={request.isLoading()}
                            onClick={onSwitchCohorts}
                        >
                            Switch Cohorts
                        </LoadingButton>
                    </DialogActions>

                    <RequestSnackbar request={request} />
                </Dialog>
            )}
        </>
    );
}
