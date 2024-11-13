import { toPgnDate } from '@/api/gameApi';
import { RequestSnackbar } from '@/api/Request';
import { useChess } from '@/board/pgn/PgnBoard';
import useGame from '@/context/useGame';
import { Game } from '@/database/game';
import useSaveGame from '@/hooks/useSaveGame';
import { UpdateGameRequest } from '@jackstenglein/chess-dojo-common/src/database/game';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import SaveGameDialogue, { SaveGameForm } from './SaveGameDialogue';

interface UnpublishedGameBannerProps {
    game?: Game;
    onSaveGame?: (g: Game) => void;
}

export function UnpublishedGameBanner(_: UnpublishedGameBannerProps) {
    const [showDialogue, setShowDialogue] = useState<boolean>(false);
    const { game } = useGame();
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
            headers: {
                white: form.white,
                black: form.black,
                result: form.result,
                date: pgnDate,
            },
            unlisted: false,
            pgnText: chess.renderPgn(),
        };

        await updateGame(req).then(() => {
            setShowDialogue(false);
        });
    };

    return (
        <>
            <Alert
                severity='info'
                variant='outlined'
                action={<Button onClick={() => setShowDialogue(true)}>Publish</Button>}
            >
                <Stack direction='row' alignItems='center'>
                    <Typography variant='body1'>
                        This game is hidden. Publish or share its URL.
                    </Typography>
                </Stack>
            </Alert>
            <SaveGameDialogue
                open={showDialogue}
                title='Publish Game'
                loading={request.isLoading()}
                onSubmit={onSubmit}
                onClose={() => setShowDialogue(false)}
            />
            <RequestSnackbar request={request} />
        </>
    );
}
