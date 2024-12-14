import { toPgnDate } from '@/api/gameApi';
import { RequestSnackbar } from '@/api/Request';
import { useChess } from '@/board/pgn/PgnBoard';
import useGame from '@/context/useGame';
import useSaveGame from '@/hooks/useSaveGame';
import {
    GameImportTypes,
    UpdateGameRequest,
} from '@jackstenglein/chess-dojo-common/src/database/game';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import SaveGameDialog, { SaveGameDialogType, SaveGameForm } from './SaveGameDialog';

interface UnpublishedGameBannerProps {
    dismissable?: boolean;
}

export function UnpublishedGameBanner({ dismissable }: UnpublishedGameBannerProps) {
    const [showDialog, setShowDialog] = useState(false);
    const [showBanner, setShowBanner] = useState(true);
    const { game, onUpdateGame } = useGame();
    const { chess } = useChess();
    const { updateGame, request } = useSaveGame();

    const onSubmit = async (form: SaveGameForm) => {
        if (!chess || !game) {
            return;
        }

        const pgnDate = toPgnDate(form.date) ?? '???.??.??';

        chess.setHeader('White', form.white);
        chess.setHeader('Black', form.black);
        chess.setHeader('Result', form.result);
        chess.setHeader('Date', pgnDate);

        const req: UpdateGameRequest = {
            id: game.id,
            cohort: game.cohort,
            timelineId: game.timelineId,
            unlisted: false,
            pgnText: chess.renderPgn(),
            type: GameImportTypes.manual,
            orientation: form.orientation,
        };

        await updateGame(req).then(() => {
            onUpdateGame?.({ ...game, unlisted: false, orientation: form.orientation });
            setShowDialog(false);
            setShowBanner(false);
        });
    };

    return (
        <>
            {showBanner && (
                <Alert
                    severity='info'
                    variant='outlined'
                    action={
                        <Box>
                            {dismissable && (
                                <Button onClick={() => setShowBanner(false)}>
                                    Dismiss
                                </Button>
                            )}
                            <Button onClick={() => setShowDialog(true)}>Publish</Button>
                        </Box>
                    }
                >
                    <Stack direction='row' alignItems='center'>
                        <Typography variant='body1'>
                            This game is not published
                        </Typography>
                    </Stack>
                </Alert>
            )}
            {showDialog && (
                <SaveGameDialog
                    type={SaveGameDialogType.Publish}
                    open={showDialog}
                    title='Publish Game'
                    loading={request.isLoading()}
                    onSubmit={onSubmit}
                    onClose={() => setShowDialog(false)}
                />
            )}
            <RequestSnackbar request={request} />
        </>
    );
}
