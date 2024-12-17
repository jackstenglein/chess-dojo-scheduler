import { toPgnDate } from '@/api/gameApi';
import { RequestSnackbar } from '@/api/Request';
import { useChess } from '@/board/pgn/PgnBoard';
import useSaveGame from '@/hooks/useSaveGame';
import {
    CreateGameRequest,
    GameImportTypes,
} from '@jackstenglein/chess-dojo-common/src/database/game';
import { CloudOff } from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { useState } from 'react';
import SaveGameDialog, { SaveGameDialogType, SaveGameForm } from './SaveGameDialog';

/**
 * A hook that encapsulates functionality for the UnsavedGameBanner and UnsavedGameIcon.
 */
function useUnsavedGame() {
    const [showDialog, setShowDialog] = useState(false);
    const [showBanner, setShowBanner] = useState(true);
    const { createGame, stagedGame, request } = useSaveGame();
    const { chess } = useChess();

    const onSubmit = async (form: SaveGameForm) => {
        if (!chess) {
            return;
        }

        chess.setHeader('White', form.white);
        chess.setHeader('Black', form.black);
        chess.setHeader('Result', form.result);
        chess.setHeader('Date', toPgnDate(form.date) ?? '???.??.??');

        const pgnText = chess.pgn.render();
        const req: CreateGameRequest = stagedGame ?? {
            pgnText,
            type: GameImportTypes.manual,
        };

        req.pgnText = pgnText;
        req.publish = form.publish;
        req.orientation = form.orientation;

        await createGame(req).then(() => {
            setShowDialog(false);
        });
    };

    return {
        showDialog,
        setShowDialog,
        showBanner,
        setShowBanner,
        request,
        onSubmit,
    };
}

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
                                <Button onClick={() => setShowBanner(false)}>
                                    Dismiss
                                </Button>
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
