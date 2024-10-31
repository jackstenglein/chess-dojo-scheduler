import { Game } from '@/database/game';
import useSaveGame from '@/hooks/useSaveGame';
import { Alert, Button, Stack, Typography } from '@mui/material';

interface UnsavedGameBannerProps {
    game: Game;
    onSaveGame: (g: Game) => void;
}

export function UnsavedGameBanner({ game, onSaveGame }: UnsavedGameBannerProps) {
    /*const { request, saveGame } =*/ useSaveGame({ game, onSaveGame });
    return (
        <>
            <Alert severity='warning' variant='outlined' action={<Button>Save</Button>}>
                <Stack direction='row' alignItems='center'>
                    <Typography variant='body1'>Warning! Game is not saved.</Typography>
                </Stack>
            </Alert>
        </>
    );
}
