import { useFreeTier } from '@/auth/Auth';
import { GameInfo, GameKey } from '@/database/game';
import { DirectoryCacheProvider } from '@/profile/directories/DirectoryCache';
import { Close, CreateNewFolder, Visibility, VisibilityOff } from '@mui/icons-material';
import {
    Alert,
    IconButton,
    Paper,
    Snackbar,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { Dispatch, SetStateAction, useState } from 'react';
import { AddToDirectoryDialog } from '../../../games/list/AddToDirectoryDialog';
import DeleteGameButton from '../../../games/view/DeleteGameButton';
import { ChangeVisibilityDialog } from './ChangeVisibilityDialog';

export function BulkGameEditor({
    games,
    onClear,
    onDelete,
    setGames,
}: {
    games: GameInfo[];
    onClear: () => void;
    onDelete: (games: GameKey[]) => void;
    /** Callback invoked to update the cached list of games after they have been edited. */
    setGames: Dispatch<SetStateAction<GameInfo[]>>;
}) {
    const isFreeTier = useFreeTier();
    const [directoryPickerOpen, setDirectoryPickerOpen] = useState(false);
    const [visibilityDialog, setVisibilityDialog] = useState('');
    const [visibilitySkipped, setVisibilitySkipped] = useState<GameKey[]>([]);

    if (games.length === 0) {
        return null;
    }

    const handleDelete = (games: GameKey[]) => {
        onDelete(games);
        onClear();
    };

    const handleVisibilityChange = (updated: GameKey[], skipped: GameKey[]) => {
        setGames((games) => {
            return games.map((g) => {
                if (updated.some((g2) => g.cohort === g2.cohort && g.id === g2.id)) {
                    return { ...g, unlisted: visibilityDialog === 'unlisted' };
                }
                return g;
            });
        });
        setVisibilityDialog('');
        setVisibilitySkipped(skipped);
    };

    const unpublished = games.filter((g) => g.unlisted);
    const published = games.filter((g) => !g.unlisted);

    return (
        <Paper elevation={4} sx={{ borderRadius: '1.5rem', flexGrow: 1, py: 0.5, px: 1 }}>
            <Stack direction='row' alignItems='center'>
                <Tooltip title='Clear selection'>
                    <IconButton size='small' onClick={onClear}>
                        <Close />
                    </IconButton>
                </Tooltip>

                <Typography sx={{ ml: 1, mr: 2.5 }}>{games.length} selected</Typography>

                <Tooltip title='Add to Folder'>
                    <IconButton size='small' onClick={() => setDirectoryPickerOpen(true)}>
                        <CreateNewFolder />
                    </IconButton>
                </Tooltip>

                {unpublished.length > 0 && !isFreeTier && (
                    <Tooltip title={`Publish Game${unpublished.length !== 1 ? 's' : ''}`}>
                        <IconButton
                            size='small'
                            onClick={() => setVisibilityDialog('published')}
                        >
                            <Visibility />
                        </IconButton>
                    </Tooltip>
                )}

                {published.length > 0 && (
                    <Tooltip title={`Unlist Game${published.length !== 1 ? 's' : ''}`}>
                        <IconButton
                            size='small'
                            onClick={() => setVisibilityDialog('unlisted')}
                        >
                            <VisibilityOff />
                        </IconButton>
                    </Tooltip>
                )}

                <DeleteGameButton
                    games={games}
                    slotProps={{
                        icon: {
                            size: 'small',
                        },
                    }}
                    onSuccess={handleDelete}
                />
            </Stack>

            <DirectoryCacheProvider>
                <AddToDirectoryDialog
                    open={directoryPickerOpen}
                    games={games}
                    onClose={() => setDirectoryPickerOpen(false)}
                />
            </DirectoryCacheProvider>

            {visibilityDialog && (
                <ChangeVisibilityDialog
                    games={visibilityDialog === 'unlisted' ? published : unpublished}
                    onCancel={() => setVisibilityDialog('')}
                    onSuccess={handleVisibilityChange}
                    unlisted={visibilityDialog === 'unlisted'}
                />
            )}

            <Snackbar
                open={visibilitySkipped.length > 0}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity='error'
                    variant='filled'
                    onClose={() => setVisibilitySkipped([])}
                >
                    {visibilitySkipped.length} game
                    {visibilitySkipped.length !== 1 ? 's were' : ' was'} not able to be
                    published because{' '}
                    {visibilitySkipped.length !== 1 ? 'they are' : 'it is'} missing data.
                </Alert>
            </Snackbar>
        </Paper>
    );
}
