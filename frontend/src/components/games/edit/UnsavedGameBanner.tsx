import { toPgnDate } from '@/api/gameApi';
import { RequestSnackbar } from '@/api/Request';
import { useChess } from '@/board/pgn/PgnBoard';
import useSaveGame from '@/hooks/useSaveGame';
import {
    CreateGameRequest,
    GameImportTypes,
} from '@jackstenglein/chess-dojo-common/src/database/game';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import SaveGameDialog, { SaveGameForm } from './SaveGameDialog';

interface UnsavedGameBannerProps {
    dismissable?: boolean;
}
export function UnsavedGameBanner({ dismissable }: UnsavedGameBannerProps) {
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

        await createGame(req).then(() => {
            setShowDialog(false);
        });
    };

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
            <SaveGameDialog
                open={showDialog}
                title='Save Analysis'
                loading={request.isLoading()}
                onSubmit={onSubmit}
                onClose={() => setShowDialog(false)}
                skippable
            />
            <RequestSnackbar request={request} />
        </>
    );
}
