import { Game } from '@/database/game';
import { Alert, Button, Stack, Typography } from '@mui/material';

interface UnsavedGameBannerProps {
    game?: Game;
    onSaveGame?: (g: Game) => void;
}

export function UnsavedGameBanner(_: UnsavedGameBannerProps) {
    return (
        <Alert
            severity='warning'
            variant='outlined'
            action={
                <>
                    <Button>Publish</Button>
                    <Button>Save</Button>
                </>
            }
        >
            <Stack direction='row' alignItems='center'>
                <Typography variant='body1'>Warning! Game is not saved.</Typography>
            </Stack>
        </Alert>
    );
}
