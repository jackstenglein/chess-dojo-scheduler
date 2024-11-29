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
import SaveGameDialogue, { SaveGameForm } from './SaveGameDialogue';

interface UnsavedGameBannerProps {
    dismissable?: boolean;
}
export function UnsavedGameBanner({ dismissable }: UnsavedGameBannerProps) {
    const [showDialogue, setShowDialogue] = useState<boolean>(false);
    const [showBanner, setShowBanner] = useState<boolean>(true);
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
            setShowDialogue(false);
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
                            <Button onClick={() => setShowDialogue(true)}>Save</Button>
                        </Box>
                    }
                    onClose={() => setShowBanner(false)}
                >
                    <Stack direction='row' alignItems='center'>
                        <Typography variant='body1'>Analysis not saved</Typography>
                    </Stack>
                </Alert>
            )}
            <SaveGameDialogue
                open={showDialogue}
                title='Create Game'
                loading={request.isLoading()}
                onSubmit={onSubmit}
                onClose={() => setShowDialogue(false)}
            />
            <RequestSnackbar request={request} />
        </>
    );
}
