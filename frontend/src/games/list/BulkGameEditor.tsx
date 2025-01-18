import { GameKey } from '@/database/game';
import { Close } from '@mui/icons-material';
import { IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';
import DeleteGameButton from '../view/DeleteGameButton';

export function BulkGameEditor({
    games,
    onClear,
    onDelete,
}: {
    games: GameKey[];
    onClear: () => void;
    onDelete: (games: GameKey[]) => void;
}) {
    if (games.length === 0) {
        return null;
    }

    return (
        <Paper elevation={4} sx={{ borderRadius: '1.5rem', flexGrow: 1, py: 0.5, px: 1 }}>
            <Stack direction='row' alignItems='center'>
                <Tooltip title='Clear selection'>
                    <IconButton size='small' onClick={onClear}>
                        <Close />
                    </IconButton>
                </Tooltip>

                <Typography sx={{ ml: 1, mr: 2.5 }}>{games.length} selected</Typography>

                <DeleteGameButton
                    games={games}
                    slotProps={{
                        icon: {
                            size: 'small',
                        },
                    }}
                    onSuccess={onDelete}
                />
            </Stack>
        </Paper>
    );
}
