import { useAuth } from '@/auth/Auth';
import { useSearchParams } from '@/hooks/useSearchParams';
import {
    HOME_DIRECTORY_ID,
    SHARED_DIRECTORY_ID,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { ChevronLeft, ChevronRight, Home, PeopleAlt } from '@mui/icons-material';
import {
    CSSObject,
    Divider,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    List as MuiList,
    Theme,
    Tooltip,
    styled,
} from '@mui/material';
import { useState } from 'react';

const openWidth = 167;

const openedMixin = (theme: Theme): CSSObject => ({
    width: openWidth,
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: theme.spacing(6),
});

const List = styled(MuiList, { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme }) => ({
        width: openWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        '& .MuiListItemButton-root': {
            borderRadius: theme.spacing(0.75),

            '& .MuiListItemIcon-root': {
                minWidth: 0,
                justifyContent: 'center',
            },
        },
        variants: [
            {
                props: ({ open }: { open: boolean }) => open,
                style: {
                    ...openedMixin(theme),
                    '& .MuiList-root': openedMixin(theme),
                    '& .MuiListItemButton-root': {
                        '& .MuiListItemIcon-root': {
                            minWidth: 0,
                            justifyContent: 'center',
                            marginRight: theme.spacing(2),
                        },
                    },
                },
            },
            {
                props: ({ open }: { open: boolean }) => !open,
                style: {
                    ...closedMixin(theme),
                    '& .MuiList-root': closedMixin(theme),
                    '& .MuiListItemButton-root': {
                        justifyContent: 'center',

                        '& .MuiListItemIcon-root': {
                            marginRight: 'auto',
                        },

                        '& .MuiListItemText-root': {
                            opacity: 0,
                        },
                    },
                },
            },
        ],
    }),
);

export const NavigationMenu = ({
    id,
    owner,
    username,
}: {
    id: string;
    owner: string;
    username?: string;
}) => {
    const { user } = useAuth();
    const { updateSearchParams } = useSearchParams();
    const [open, setOpen] = useState(true);

    if (!user) {
        return null;
    }

    if (username && username !== user.username) {
        return null;
    }

    return (
        <List dense disablePadding open={open}>
            <Tooltip title={open ? '' : 'Home'} disableInteractive>
                <ListItemButton
                    selected={id === HOME_DIRECTORY_ID && owner === user.username}
                    onClick={() =>
                        updateSearchParams({
                            directory: HOME_DIRECTORY_ID,
                            directoryOwner: user.username,
                        })
                    }
                >
                    <ListItemIcon>
                        <Home />
                    </ListItemIcon>
                    <ListItemText primary='Home' />
                </ListItemButton>
            </Tooltip>

            <Tooltip title={open ? '' : 'Shared with Me'} disableInteractive>
                <ListItemButton
                    selected={id === SHARED_DIRECTORY_ID && owner === user.username}
                    onClick={() =>
                        updateSearchParams({
                            directory: SHARED_DIRECTORY_ID,
                            directoryOwner: user.username,
                        })
                    }
                >
                    <ListItemIcon>
                        <PeopleAlt />
                    </ListItemIcon>
                    <ListItemText primary='Shared with Me' />
                </ListItemButton>
            </Tooltip>

            <Divider />

            <Tooltip title={open ? '' : 'Expand'} disableInteractive>
                <ListItemButton onClick={() => setOpen(!open)}>
                    <ListItemIcon>
                        {open ? <ChevronLeft /> : <ChevronRight />}
                    </ListItemIcon>
                    <ListItemText primary='Collapse' />
                </ListItemButton>
            </Tooltip>
        </List>
    );
};
