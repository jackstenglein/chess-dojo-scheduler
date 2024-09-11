import { useApi } from '@/api/Api';
import { useAuth } from '@/auth/Auth';
import { RatingSystem, User } from '@/database/user';
import {
    Directory,
    DirectoryAccessRole,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { PersonAddAlt1 } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
    Autocomplete,
    Box,
    Button,
    Chip,
    debounce,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Stack,
    TextField,
} from '@mui/material';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { SiChessdotcom, SiLichess } from 'react-icons/si';
import Avatar from '../Avatar';

export const ShareButton = ({ directory }: { directory: Directory }) => {
    const [open, setOpen] = useState(false);
    const [options, setOptions] = useState<User[]>([]);
    const [inputValue, setInputValue] = useState('');
    const { user } = useAuth();
    const api = useApi();

    const searchUsers = api.searchUsers;
    const fetch = useMemo(
        () =>
            debounce((input: string, callback: (results?: User[]) => void) => {
                searchUsers(input.trim(), [
                    'display',
                    'discord',
                    RatingSystem.Chesscom,
                    RatingSystem.Lichess,
                ])
                    .then((resp) => {
                        console.log('searchUsers: ', resp);
                        callback(resp);
                    })
                    .catch((err) => {
                        console.error('searchUsers: ', err);
                    });
            }, 400),
        [searchUsers],
    );

    useEffect(() => {
        let active = true;

        if (inputValue === '') {
            return;
        }

        fetch(inputValue, (results?: User[]) => {
            if (active && results) {
                setOptions(results);
            }
        });

        return () => {
            active = false;
        };
    }, [inputValue, fetch]);

    if (
        !user?.username ||
        (user.username !== directory.owner &&
            directory.access?.[user.username] !== DirectoryAccessRole.Admin)
    ) {
        return null;
    }

    return (
        <>
            <Button
                variant='contained'
                startIcon={<PersonAddAlt1 />}
                onClick={() => setOpen(true)}
            >
                Share
            </Button>

            <Dialog fullWidth open={open} onClose={() => setOpen(false)}>
                <DialogTitle>Share {directory.name}?</DialogTitle>
                <DialogContent>
                    <Autocomplete
                        sx={{ mt: 1 }}
                        multiple
                        options={options}
                        getOptionLabel={(option) => option.displayName}
                        filterOptions={(x) => x}
                        filterSelectedOptions
                        onInputChange={(_event, newInputValue) =>
                            setInputValue(newInputValue)
                        }
                        renderInput={(params) => (
                            <TextField {...params} label='Add people' />
                        )}
                        renderTags={(users, getTagProps) =>
                            users.map((user, index) => {
                                const { key, ...tagProps } = getTagProps({ index });
                                return (
                                    <Chip
                                        key={key}
                                        avatar={
                                            <Avatar
                                                user={user}
                                                size={24}
                                                sx={{ ml: 0.5, mr: -0.5 }}
                                            />
                                        }
                                        label={user.displayName}
                                        {...tagProps}
                                    />
                                );
                            })
                        }
                        renderOption={(props, user) => {
                            return (
                                <Fragment key={user.username}>
                                    <ListItem
                                        {...props}
                                        sx={{ alignItems: 'flex-start !important' }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar
                                                user={user}
                                                size={40}
                                                sx={{ mt: 0.5 }}
                                            />
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Stack>
                                                    <span>{user.displayName}</span>
                                                    <Box
                                                        component='span'
                                                        color='text.secondary'
                                                    >
                                                        {user.dojoCohort}
                                                    </Box>
                                                </Stack>
                                            }
                                            secondary={<ListItemSecondary user={user} />}
                                        />
                                    </ListItem>
                                    <Divider component='li' />
                                </Fragment>
                            );
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <LoadingButton>Share</LoadingButton>
                </DialogActions>
            </Dialog>
        </>
    );
};

function ListItemSecondary({ user }: { user: User }) {
    const chesscom = user.ratings[RatingSystem.Chesscom]?.username;
    const lichess = user.ratings[RatingSystem.Lichess]?.username;

    return (
        <Stack direction='row' flexWrap='wrap' columnGap={1.5}>
            {chesscom && (
                <span>
                    <SiChessdotcom
                        style={{ color: '#81b64c', verticalAlign: 'middle' }}
                    />{' '}
                    {chesscom}
                </span>
            )}
            {lichess && (
                <span>
                    <SiLichess style={{ verticalAlign: 'middle' }} /> {lichess}
                </span>
            )}
        </Stack>
    );
}
