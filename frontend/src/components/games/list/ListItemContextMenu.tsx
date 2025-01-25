import { useFreeTier } from '@/auth/Auth';
import { GameInfo, GameKey } from '@/database/game';
import { DirectoryCacheProvider } from '@/profile/directories/DirectoryCache';
import { CreateNewFolder, Delete, Visibility, VisibilityOff } from '@mui/icons-material';
import {
    Alert,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    PopoverPosition,
    Snackbar,
} from '@mui/material';
import { Dispatch, SetStateAction, useState } from 'react';
import { AddToDirectoryDialog } from '../../../games/list/AddToDirectoryDialog';
import { DeleteGamesDialog } from '../../../games/view/DeleteGameButton';
import { ChangeVisibilityDialog } from './ChangeVisibilityDialog';

export const ListItemContextMenu = ({
    games,
    position,
    onClose,
    allowEdits,
    setGames,
}: {
    games?: GameInfo[];
    position: PopoverPosition | undefined;
    onClose: () => void;
    /** Whether to show options related to editing games. */
    allowEdits?: boolean;
    /** Callback invoked to update the cached list of games after they have been edited. */
    setGames?: Dispatch<SetStateAction<GameInfo[]>>;
}) => {
    const [directoryPickerOpen, setDirectoryPickerOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [visibilityDialog, setVisibilityDialog] = useState('');
    const [visibilitySkipped, setVisibilitySkipped] = useState<GameKey[]>([]);
    const isFreeTier = useFreeTier();

    const handleClose = () => {
        setDirectoryPickerOpen(false);
        setDeleteOpen(false);
        onClose();
    };

    const handleDelete = (keys: GameKey[]) => {
        setGames?.((gs) =>
            gs.filter((g) => {
                const key = keys.find(
                    (key) => key.cohort === g.cohort && key.id === g.id,
                );
                return !key;
            }),
        );
        handleClose();
    };

    const handleVisibilityChange = (updated: GameKey[], skipped: GameKey[]) => {
        setGames?.((games) => {
            return games.map((g) => {
                if (updated.some((g2) => g.cohort === g2.cohort && g.id === g2.id)) {
                    return { ...g, unlisted: visibilityDialog === 'unlisted' };
                }
                return g;
            });
        });
        setVisibilityDialog('');
        setVisibilitySkipped(skipped);
        onClose();
    };

    const unpublished = games?.filter((g) => g.unlisted) ?? [];
    const published = games?.filter((g) => !g.unlisted) ?? [];

    return (
        <DirectoryCacheProvider>
            <Menu
                open={!!games?.length}
                onClose={onClose}
                anchorReference='anchorPosition'
                anchorPosition={position}
                slotProps={{
                    root: {
                        onContextMenu: (e) => {
                            e.preventDefault();
                            handleClose();
                        },
                    },
                }}
            >
                <MenuItem onClick={() => setDirectoryPickerOpen(true)}>
                    <ListItemIcon>
                        <CreateNewFolder />
                    </ListItemIcon>
                    <ListItemText primary='Add to Folder' />
                </MenuItem>

                {allowEdits && (
                    <>
                        {unpublished.length > 0 && !isFreeTier && (
                            <MenuItem onClick={() => setVisibilityDialog('published')}>
                                <ListItemIcon>
                                    <Visibility />
                                </ListItemIcon>
                                <ListItemText
                                    primary={`Publish Game${unpublished.length !== 1 ? 's' : ''}`}
                                />
                            </MenuItem>
                        )}

                        {published.length > 0 && (
                            <MenuItem onClick={() => setVisibilityDialog('unlisted')}>
                                <ListItemIcon>
                                    <VisibilityOff />
                                </ListItemIcon>
                                <ListItemText
                                    primary={`Unlist Game${published.length !== 1 ? 's' : ''}`}
                                />
                            </MenuItem>
                        )}

                        <MenuItem onClick={() => setDeleteOpen(true)}>
                            <ListItemIcon>
                                <Delete />
                            </ListItemIcon>
                            <ListItemText
                                primary={`Delete Game${games?.length !== 1 ? 's' : ''}`}
                            />
                        </MenuItem>
                    </>
                )}
            </Menu>

            <AddToDirectoryDialog
                open={directoryPickerOpen}
                games={games}
                onClose={handleClose}
            />

            {games && (
                <DeleteGamesDialog
                    open={deleteOpen}
                    onClose={() => setDeleteOpen(false)}
                    onSuccess={handleDelete}
                    games={games}
                />
            )}

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
        </DirectoryCacheProvider>
    );
};
