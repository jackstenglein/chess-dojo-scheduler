import { toPgnDate } from '@/api/gameApi';
import { useChess } from '@/board/pgn/PgnBoard';
import useSaveGame from '@/hooks/useSaveGame';
import {
    CreateGameRequest,
    GameImportTypes,
} from '@jackstenglein/chess-dojo-common/src/database/game';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import SaveGameDialogue, { SaveGameForm } from './SaveGameDialogue';

export function UnsavedGameBanner() {
    const [showDialogue, setShowDialogue] = useState<boolean>(false);
    const { createGame, stagedCreateGame, request } = useSaveGame();
    const { chess } = useChess();

    const onSubmit = (form: SaveGameForm) => {
        if (!chess) {
            return;
        }

        chess.setHeader('White', form.white);
        chess.setHeader('Black', form.black);
        chess.setHeader('Result', form.result);
        chess.setHeader('Date', toPgnDate(form.date) ?? '???.??.??');

        const pgnText = chess.pgn.render();
        const req: CreateGameRequest = stagedCreateGame ?? {
            pgnText,
            type: GameImportTypes.manual,
        };

        req.pgnText = pgnText;

        createGame(req)
            .then(() => {
                setShowDialogue(false);
            })
            .catch(() => {
                request.onFailure();
            });
    };

    return (
        <>
            <Alert
                severity='warning'
                variant='outlined'
                action={<Button onClick={() => setShowDialogue(true)}>Create</Button>}
            >
                <Stack direction='row' alignItems='center'>
                    <Typography variant='body1'>
                        Changes not autosaved until game is created.
                    </Typography>
                </Stack>
            </Alert>
            <SaveGameDialogue
                open={showDialogue}
                title='Create Game'
                loading={request.isLoading()}
                onSubmit={onSubmit}
                onClose={() => setShowDialogue(false)}
            />
        </>
    );
}
