import React, { useState } from 'react';
import { NavigateFunction, useNavigate } from 'react-router-dom';
import {
    Button,
    IconButton,
    ListItemIcon,
    Menu,
    MenuItem,
    Stack,
    Typography,
    useMediaQuery,
    Badge,
    Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Person2Icon from '@mui/icons-material/Person2';
import FeedIcon from '@mui/icons-material/Feed';
import ScoreboardIcon from '@mui/icons-material/Scoreboard';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HelpIcon from '@mui/icons-material/Help';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MerchIcon from '@mui/icons-material/Sell';
import TournamentsIcon from '@mui/icons-material/EmojiEvents';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChecklistIcon from '@mui/icons-material/Checklist';

import { AuthStatus, useAuth } from '../auth/Auth';
import PawnIcon from './PawnIcon';
import { hasCreatedProfile } from '../database/user';
import NotificationButton from '../notifications/NotificationButton';
import { useNotifications } from '../api/cache/Cache';
import ProfileButton from './ProfileButton';

const Logo = () => {
    const navigate = useNavigate();
    return (
        <img
            src='/logo192.png'
            style={{
                paddingTop: '10px',
                paddingBottom: '10px',
                maxHeight: '100%',
                marginRight: '15px',
                cursor: 'pointer',
            }}
            alt=''
            onClick={() => navigate('/')}
        />
    );
};

interface MenuProps {
    meetingCount: number;
}

const LargeMenuUnauthenticated = () => {
    const navigate = useNavigate();

    return (
        <>
            <Logo />
            <Stack spacing={1} direction='row' sx={{ flexGrow: 1 }}>
                <Button
                    onClick={() => navigate('/tournaments')}
                    sx={{ color: 'white' }}
                    startIcon={<TournamentsIcon />}
                >
                    Tournaments
                </Button>
                <Button
                    href='https://www.chessdojo.club/shop'
                    target='_blank'
                    rel='noopener'
                    sx={{ color: 'white' }}
                    startIcon={<MerchIcon />}
                >
                    Merch
                </Button>
            </Stack>
            <Stack spacing={1} direction='row'>
                <Button onClick={() => navigate('/signin')} sx={{ color: 'white' }}>
                    Sign In
                </Button>
                <Button onClick={() => navigate('/signup')} sx={{ color: 'white' }}>
                    Sign Up
                </Button>
            </Stack>
        </>
    );
};

interface NavbarItem {
    name: string;
    icon: JSX.Element | null;
    onClick: () => void;
}

function allStartItems(navigate: NavigateFunction): NavbarItem[] {
    return [
        {
            name: 'Newsfeed',
            icon: <FeedIcon />,
            onClick: () => navigate('/newsfeed'),
        },
        {
            name: 'Training Plan',
            icon: <ChecklistIcon />,
            onClick: () => navigate('/profile?view=progress'),
        },
        {
            name: 'Scoreboard',
            icon: <ScoreboardIcon />,
            onClick: () => navigate('/scoreboard'),
        },
        {
            name: 'Tournaments',
            icon: <TournamentsIcon />,
            onClick: () => navigate('/tournaments'),
        },
        {
            name: 'Games',
            icon: <PawnIcon />,
            onClick: () => navigate('/games'),
        },
        {
            name: 'Calendar',
            icon: <CalendarTodayIcon />,
            onClick: () => navigate('/calendar'),
        },
        {
            name: 'Material',
            icon: <MenuBookIcon />,
            onClick: () => navigate('/material'),
        },
        {
            name: 'Merch',
            icon: <MerchIcon />,
            onClick: () => window.open('https://www.chessdojo.club/shop', '_blank'),
        },
    ];
}

function helpItem(navigate: NavigateFunction): NavbarItem {
    return {
        name: 'Help',
        icon: <HelpIcon />,
        onClick: () => navigate('/help'),
    };
}

function NotificationsMenuItem({
    handleClick,
}: {
    handleClick: (func: () => void) => () => void;
}): JSX.Element {
    const { notifications } = useNotifications();
    const navigate = useNavigate();

    return (
        <MenuItem onClick={handleClick(() => navigate('/notifications'))}>
            <ListItemIcon>
                <Badge
                    badgeContent={notifications.length}
                    color='secondary'
                    overlap='circular'
                >
                    <NotificationsIcon />
                </Badge>
            </ListItemIcon>
            <Typography textAlign='center'>Notifications</Typography>
        </MenuItem>
    );
}

function renderStartItem(item: NavbarItem, meetingCount: number) {
    if (item.name === 'Calendar') {
        return (
            <Badge badgeContent={meetingCount} color='secondary'>
                <Button
                    key={item.name}
                    onClick={item.onClick}
                    sx={{ color: 'white', whiteSpace: 'nowrap' }}
                    startIcon={item.icon}
                >
                    {item.name}
                </Button>
            </Badge>
        );
    }

    return (
        <Button
            key={item.name}
            onClick={item.onClick}
            sx={{ color: 'white', whiteSpace: 'nowrap' }}
            startIcon={item.icon}
        >
            {item.name}
        </Button>
    );
}

function renderMenuItem(
    item: NavbarItem,
    handleClick: (func: () => void) => () => void,
    meetingCount?: number
) {
    return (
        <MenuItem key={item.name} onClick={handleClick(item.onClick)}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <Typography textAlign='center'>
                {item.name}
                {item.name === 'Calendar' && meetingCount ? ` (${meetingCount})` : ''}
            </Typography>
        </MenuItem>
    );
}

function HelpButton(navigate: NavigateFunction) {
    return (
        <Tooltip key='help' title='Help'>
            <IconButton
                data-cy='Help'
                key='help'
                sx={{ color: 'white' }}
                onClick={() => navigate('/help')}
            >
                <HelpIcon />
            </IconButton>
        </Tooltip>
    );
}

function useNavbarItems(
    meetingCount: number,
    handleClick: (func: () => void) => () => void
) {
    const navigate = useNavigate();

    const showAll = useMediaQuery('(min-width:1340px)');
    const hide2 = useMediaQuery('(min-width:1177px)');
    const hide3 = useMediaQuery('(min-width:1049px)');
    const hide4 = useMediaQuery('(min-width:949px)');
    const hide5 = useMediaQuery('(min-width:783px)');

    const showHelp = useMediaQuery('(min-width:624px)');
    const showNotifications = useMediaQuery('(min-width:567px)');
    const showProfileDropdown = useMediaQuery('(min-width:542px)');

    const startItems = allStartItems(navigate);

    let startItemCount = 0;
    if (showAll) {
        startItemCount = startItems.length;
    } else if (hide2) {
        startItemCount = startItems.length - 2;
    } else if (hide3) {
        startItemCount = startItems.length - 3;
    } else if (hide4) {
        startItemCount = startItems.length - 4;
    } else if (hide5) {
        startItemCount = startItems.length - 5;
    } else {
        startItemCount = startItems.length - 6;
    }

    const shownStartItems: JSX.Element[] = startItems
        .slice(0, startItemCount)
        .map((item) => renderStartItem(item, meetingCount));

    const menuItems: JSX.Element[] = startItems
        .slice(startItemCount)
        .map((item) => renderMenuItem(item, handleClick, meetingCount));

    const endItems: JSX.Element[] = [];

    if (showNotifications) {
        endItems.push(<NotificationButton key='notifications' />);
    } else {
        menuItems.push(
            <NotificationsMenuItem key='notifications' handleClick={handleClick} />
        );
    }

    if (showHelp) {
        endItems.push(HelpButton(navigate));
    } else {
        menuItems.push(renderMenuItem(helpItem(navigate), handleClick));
    }

    if (showProfileDropdown) {
        endItems.push(<ProfileButton key='profileDropdown' />);
    }

    return {
        startItems: shownStartItems,
        menuItems: menuItems,
        endItems: endItems,
    };
}

const LargeMenu: React.FC<MenuProps> = ({ meetingCount }) => {
    const auth = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleClick = (func: () => void) => {
        return () => {
            func();
            handleClose();
        };
    };

    const { startItems, menuItems, endItems } = useNavbarItems(meetingCount, handleClick);

    if (auth.status === AuthStatus.Unauthenticated) {
        return <LargeMenuUnauthenticated />;
    }

    const profileCreated = hasCreatedProfile(auth.user!);

    if (!profileCreated) {
        return (
            <>
                <Logo />
                <Stack spacing={1} direction='row' sx={{ flexGrow: 1 }}>
                    <Button
                        onClick={() => navigate('/profile')}
                        sx={{ color: 'white' }}
                        startIcon={<Person2Icon />}
                    >
                        Profile
                    </Button>
                </Stack>

                <Button onClick={() => navigate('/help')} sx={{ color: 'white' }}>
                    Help
                </Button>

                <Button onClick={auth.signout} sx={{ color: 'white' }}>
                    Sign Out
                </Button>
            </>
        );
    }

    return (
        <>
            <Logo />
            <Stack spacing={1} direction='row' sx={{ flexGrow: 1 }}>
                {startItems}

                {menuItems.length > 0 && (
                    <>
                        <Tooltip title='More'>
                            <IconButton
                                data-cy='navbar-more-button'
                                onClick={handleOpen}
                                sx={{ color: 'white' }}
                            >
                                <MenuIcon />
                            </IconButton>
                        </Tooltip>
                        <Menu
                            id='menu-appbar'
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                        >
                            {menuItems}
                        </Menu>
                    </>
                )}
            </Stack>

            {endItems}
        </>
    );
};

const ExtraSmallMenuUnauthenticated = () => {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleClick = (func: () => void) => {
        return () => {
            func();
            handleClose();
        };
    };

    return (
        <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='center'
            sx={{ flexGrow: 1, height: 1 }}
        >
            <Logo />
            <IconButton
                data-cy='navbar-more-button'
                size='medium'
                aria-label='navigation menu'
                aria-controls='menu-appbar'
                aria-haspopup='true'
                onClick={handleOpen}
                color='inherit'
            >
                <MenuIcon />
            </IconButton>
            <Menu
                id='menu-appbar'
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
            >
                <MenuItem onClick={handleClick(() => navigate('/signin'))}>
                    <Typography textAlign='center'>Sign In</Typography>
                </MenuItem>
                <MenuItem onClick={handleClick(() => navigate('/signup'))}>
                    <Typography textAlign='center'>Sign Up</Typography>
                </MenuItem>
                <MenuItem onClick={handleClick(() => navigate('/tournaments'))}>
                    <Typography textAlign='center'>Tournaments</Typography>
                </MenuItem>
                <MenuItem
                    onClick={() =>
                        window.open('https://www.chessdojo.club/shop', '_blank')
                    }
                >
                    <Typography textAlign='center'>Merch</Typography>
                </MenuItem>
            </Menu>
        </Stack>
    );
};

const ExtraSmallMenu: React.FC<MenuProps> = ({ meetingCount }) => {
    const auth = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const { notifications } = useNotifications();

    const startItems = allStartItems(navigate);

    if (auth.status === AuthStatus.Unauthenticated) {
        return <ExtraSmallMenuUnauthenticated />;
    }

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleClick = (func: () => void) => {
        return () => {
            func();
            handleClose();
        };
    };

    const profileCreated = hasCreatedProfile(auth.user!);

    let startItemsJsx: JSX.Element[] = [];
    if (profileCreated) {
        startItemsJsx = startItems.map((item) => (
            <MenuItem key={item.name} onClick={handleClick(item.onClick)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <Typography textAlign='center'>
                    {item.name}
                    {item.name === 'Calendar' && meetingCount ? ` (${meetingCount})` : ''}
                </Typography>
            </MenuItem>
        ));
    }

    return (
        <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='center'
            sx={{ flexGrow: 1, height: 1 }}
        >
            <Logo />
            <IconButton
                data-cy='navbar-more-button'
                size='medium'
                aria-label='navigation menu'
                aria-controls='menu-appbar'
                aria-haspopup='true'
                onClick={handleOpen}
                color='inherit'
            >
                <MenuIcon />
            </IconButton>
            <Menu
                id='menu-appbar'
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
            >
                {!profileCreated && (
                    <MenuItem onClick={handleClick(() => navigate('/profile'))}>
                        <ListItemIcon>
                            <Person2Icon />
                        </ListItemIcon>
                        <Typography textAlign='center'>Profile</Typography>
                    </MenuItem>
                )}

                {startItemsJsx}

                <MenuItem onClick={handleClick(() => navigate('/notifications'))}>
                    <ListItemIcon>
                        <Badge
                            badgeContent={notifications.length}
                            color='secondary'
                            overlap='circular'
                        >
                            <NotificationsIcon />
                        </Badge>
                    </ListItemIcon>
                    <Typography textAlign='center'>Notifications</Typography>
                </MenuItem>

                <MenuItem onClick={handleClick(() => navigate('/help'))}>
                    <ListItemIcon>
                        <HelpIcon />
                    </ListItemIcon>
                    <Typography textAlign='center'>Help</Typography>
                </MenuItem>

                <MenuItem onClick={handleClick(auth.signout)}>
                    <ListItemIcon>
                        <LogoutIcon color='error' />
                    </ListItemIcon>
                    <Typography textAlign='center' color='error'>
                        Sign Out
                    </Typography>
                </MenuItem>
            </Menu>
        </Stack>
    );
};

const NavbarMenu: React.FC<MenuProps> = ({ meetingCount }) => {
    const auth = useAuth();
    const largeMenu = useMediaQuery('(min-width:450px)');

    if (auth.status === AuthStatus.Loading) {
        return <Logo />;
    }

    if (largeMenu) {
        return <LargeMenu meetingCount={meetingCount} />;
    }

    return <ExtraSmallMenu meetingCount={meetingCount} />;
};

export default NavbarMenu;
