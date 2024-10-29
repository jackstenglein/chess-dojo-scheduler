import { RequestSnackbar } from '@/api/Request';
import { Game } from '@/database/game';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { request } from 'http';

interface UnsavedGameBannerProps {
    game?: Game;
    onSaveGame?: (g: Game) => void;
}

export function UnsavedGameBanner(_: UnsavedGameBannerProps) {
    return (
        <>
            <Alert severity='warning' variant='outlined' action={<Button>Save</Button>}>
                <Stack direction='row' alignItems='center'>
                    <Typography variant='body1'>Warning! Game is not saved.</Typography>
                </Stack>
            </Alert>

            <RequestSnackbar request={request} showSuccess />
        </>
    );
}
