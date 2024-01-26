import React, { useState } from 'react';
import copy from 'copy-to-clipboard';
import {
    Stack,
    TextField,
    Tooltip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    MenuItem,
    FormControlLabel,
    Checkbox,
    Typography,
    DialogActions,
    Button,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import HelpIcon from '@mui/icons-material/Help';

import { ExplorerPositionFollower } from '../../../database/explorer';
import { dojoCohorts } from '../../../database/user';
import { useApi } from '../../../api/Api';
import { RequestSnackbar, useRequest } from '../../../api/Request';
import { LoadingButton } from '@mui/lab';
import { useFreeTier } from '../../../auth/Auth';

interface HeaderProps {
    fen: string;
    follower: ExplorerPositionFollower | null | undefined;
    minCohort: string;
    maxCohort: string;
    setFollower: (f: ExplorerPositionFollower | null) => void;
}

const Header: React.FC<HeaderProps> = ({
    fen,
    follower,
    minCohort,
    maxCohort,
    setFollower,
}) => {
    const isFreeTier = useFreeTier();
    const [copied, setCopied] = useState('');
    const [showFollowDialog, setShowFollowDialog] = useState(false);

    const onCopy = () => {
        copy(fen);
        setCopied('fen');
        setTimeout(() => {
            setCopied('');
        }, 2500);
    };

    return (
        <Stack direction='row' spacing={1} alignItems='center' mb={1}>
            <TextField
                size='small'
                disabled
                value={fen}
                sx={{ flexGrow: 1 }}
                inputProps={{
                    sx: {
                        fontSize: { xs: '0.8rem', md: 'initial', xl: '0.8rem' },
                    },
                }}
            />
            <Stack direction='row' alignItems='center'>
                <Tooltip title='Copy FEN'>
                    <IconButton onClick={onCopy}>
                        {copied === 'fen' ? (
                            <CheckIcon sx={{ color: 'text.secondary' }} />
                        ) : (
                            <ContentCopyIcon sx={{ color: 'text.secondary' }} />
                        )}
                    </IconButton>
                </Tooltip>

                <Tooltip
                    title={follower ? 'Edit subscription' : 'Subscribe to this position'}
                >
                    <IconButton
                        color={follower ? 'success' : 'info'}
                        onClick={() => setShowFollowDialog(!isFreeTier)}
                        disabled={isFreeTier}
                    >
                        {follower ? <BookmarkAddedIcon /> : <BookmarkAddIcon />}
                    </IconButton>
                </Tooltip>
            </Stack>

            {showFollowDialog && (
                <FollowDialog
                    fen={fen}
                    follower={follower}
                    open={showFollowDialog}
                    onClose={() => setShowFollowDialog(false)}
                    initialMinCohort={minCohort}
                    initialMaxCohort={maxCohort}
                    setFollower={setFollower}
                />
            )}
        </Stack>
    );
};

interface FollowDialogProps {
    fen: string;
    follower: ExplorerPositionFollower | null | undefined;
    initialMinCohort: string;
    initialMaxCohort: string;
    open: boolean;
    onClose: () => void;
    setFollower: (f: ExplorerPositionFollower | null) => void;
}

const FollowDialog: React.FC<FollowDialogProps> = ({
    fen,
    follower,
    initialMinCohort,
    initialMaxCohort,
    open,
    onClose,
    setFollower,
}) => {
    const [minCohort, setMinCohort] = useState(follower?.minCohort || initialMinCohort);
    const [maxCohort, setMaxCohort] = useState(follower?.maxCohort || initialMaxCohort);
    const [disableVariations, setDisableVariations] = useState(
        follower?.disableVariations || false
    );

    const api = useApi();
    const request = useRequest();
    const deleteRequest = useRequest();

    const onSubscribe = () => {
        request.onStart();

        api.followPosition({
            fen,
            minCohort: minCohort || undefined,
            maxCohort: maxCohort || undefined,
            disableVariations,
        })
            .then((resp) => {
                console.log('followPosition: ', resp);
                request.onSuccess();
                setFollower(resp.data);
                onClose();
            })
            .catch((err) => {
                console.error('followPosition: ', err);
                request.onFailure(err);
            });
    };

    const onDelete = () => {
        deleteRequest.onStart();

        api.followPosition({
            fen,
            unfollow: true,
        })
            .then((resp) => {
                console.log('followPosition: ', resp);
                deleteRequest.onSuccess();
                setFollower(resp.data);
                onClose();
            })
            .catch((err) => {
                console.error('followPosition: ', err);
                deleteRequest.onFailure(err);
            });
    };

    const loading = request.isLoading() || deleteRequest.isLoading();

    return (
        <Dialog open={open} onClose={loading ? undefined : onClose}>
            <DialogTitle>
                {follower ? 'Edit Subscription?' : 'Subscribe to this Position?'}
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Receive a notification whenever a new game is posted containing this
                    position.
                </DialogContentText>

                <Stack direction='row' spacing={1} mt={3}>
                    <TextField
                        select
                        fullWidth
                        label='Min Cohort'
                        value={minCohort}
                        onChange={(e) => setMinCohort(e.target.value)}
                    >
                        {dojoCohorts.map((cohort) => (
                            <MenuItem key={cohort} value={cohort}>
                                {cohort}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        fullWidth
                        label='Max Cohort'
                        value={maxCohort}
                        onChange={(e) => setMaxCohort(e.target.value)}
                    >
                        {dojoCohorts.map((cohort) => (
                            <MenuItem key={cohort} value={cohort}>
                                {cohort}
                            </MenuItem>
                        ))}
                    </TextField>
                </Stack>

                <FormControlLabel
                    sx={{ mt: 2 }}
                    control={
                        <Checkbox
                            checked={disableVariations}
                            onChange={(e) => setDisableVariations(e.target.checked)}
                        />
                    }
                    label={
                        <Stack direction='row' spacing={1} alignItems='center'>
                            <Typography>Ignore variations</Typography>
                            <Tooltip title="If checked, you will only be notified if the position appears in the game's mainline.">
                                <HelpIcon
                                    fontSize='small'
                                    sx={{ color: 'text.secondary' }}
                                />
                            </Tooltip>
                        </Stack>
                    }
                />
            </DialogContent>
            <DialogActions>
                <Button disabled={loading} onClick={onClose}>
                    Cancel
                </Button>

                {follower && (
                    <LoadingButton
                        loading={deleteRequest.isLoading()}
                        disabled={request.isLoading()}
                        color='error'
                        onClick={onDelete}
                    >
                        Unsubscribe
                    </LoadingButton>
                )}

                <LoadingButton
                    loading={request.isLoading()}
                    disabled={deleteRequest.isLoading()}
                    onClick={onSubscribe}
                >
                    {follower ? 'Update' : 'Subscribe'}
                </LoadingButton>
            </DialogActions>

            <RequestSnackbar request={request} />
            <RequestSnackbar request={deleteRequest} />
        </Dialog>
    );
};

export default Header;
