import { Game } from '@/database/game';
import { Alert, Button, Stack, Typography } from '@mui/material';

interface UnpublishedGameBannerProps {
    game?: Game;
    onSaveGame?: (g: Game) => void;
}

export function UnpublishedGameBanner(_: UnpublishedGameBannerProps) {
    return (
        <Alert
            severity='info'
            variant='outlined'
            action={
                <>
                    <Button>Publish</Button>
                </>
            }
        >
            <Stack direction='row' alignItems='center'>
                <Typography variant='body1'>
                    This game is hidden. Publish or share its URL.
                </Typography>
            </Stack>
        </Alert>
    );
}
