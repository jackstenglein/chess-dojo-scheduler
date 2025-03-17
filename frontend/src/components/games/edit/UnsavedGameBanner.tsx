import { RequestSnackbar } from '@/api/Request';
import { useUnsavedGame } from '@/hooks/useUnsavedGame';
import { CloudOff } from '@mui/icons-material';
import { Alert, Box, Button, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import SaveGameDialog, { SaveGameDialogType } from './SaveGameDialog';

interface UnsavedGameBannerProps {
    dismissable?: boolean;
}

/**
 * Renders a banner notifying the user that the current analysis is unsaved. The banner
 * can be optionally dismissed and can open a dialog to save the game.
 */
export function UnsavedGameBanner({ dismissable }: UnsavedGameBannerProps) {
    const { showDialog, setShowDialog, showBanner, setShowBanner, request, onSubmit } =
        useUnsavedGame();

    return (
        <>
            {showBanner && (
                <Alert
                    severity='warning'
                    variant='outlined'
                    action={
                        <Box>
                            {dismissable && (
                                <Button onClick={() => setShowBanner(false)}>Dismiss</Button>
                            )}
                            <Button onClick={() => setShowDialog(true)}>Save</Button>
                        </Box>
                    }
                >
                    <Stack direction='row' alignItems='center'>
                        <Typography>Analysis not saved</Typography>
                    </Stack>
                </Alert>
            )}
            {showDialog && (
                <SaveGameDialog
                    type={SaveGameDialogType.Save}
                    open={showDialog}
                    title='Save Analysis'
                    loading={request.isLoading()}
                    onSubmit={onSubmit}
                    onClose={() => setShowDialog(false)}
                />
            )}
            <RequestSnackbar request={request} />
        </>
    );
}

/**
 * Renders an icon notifying the user that the current analysis is unsaved. When clicked,
 * a dialog opens to save the game.
 */
export function UnsavedGameIcon() {
    const { showDialog, setShowDialog, request, onSubmit } = useUnsavedGame();

    return (
        <>
            <Tooltip title='Analysis not saved'>
                <IconButton onClick={() => setShowDialog(true)}>
                    <CloudOff color='error' />
                </IconButton>
            </Tooltip>

            {showDialog && (
                <SaveGameDialog
                    type={SaveGameDialogType.Save}
                    open={showDialog}
                    title='Save Analysis'
                    loading={request.isLoading()}
                    onSubmit={onSubmit}
                    onClose={() => setShowDialog(false)}
                />
            )}
            <RequestSnackbar request={request} />
        </>
    );
}
