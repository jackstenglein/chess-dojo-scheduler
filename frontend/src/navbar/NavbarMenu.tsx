import {
    CalendarToday,
    Checklist,
    ChevronRight,
    ExpandLess,
    ExpandMore,
    Feed,
    Forum,
    Groups,
    Help,
    Logout,
    MenuBook,
    Menu as MenuIcon,
    Notifications,
    Person2 as Person2Icon,
    Scoreboard,
    Sell,
    EmojiEvents as Tournaments,
} from '@mui/icons-material';
import {
    Badge,
    Button,
    Collapse,
    IconButton,
    List,
    ListItemIcon,
    Menu,
    MenuItem,
    Stack,
    Tooltip,
    Typography,
    useMediaQuery,
} from '@mui/material';
import React, { useState } from 'react';
import { NavigateFunction, useNavigate } from 'react-router-dom';
import { useNotifications } from '../api/cache/Cache';
import { AuthStatus, useAuth } from '../auth/Auth';
import { hasCreatedProfile } from '../database/user';
import NotificationButton from '../notifications/NotificationButton';
import PawnIcon from './PawnIcon';
import ProfileButton from './ProfileButton';
import ImportContactsIcon from '@mui/icons-material/ImportContacts';
import ExtensionIcon from '@mui/icons-material/Extension';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import PsychologyIcon from '@mui/icons-material/Psychology';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import StorefrontIcon from '@mui/icons-material/Storefront';
import UnauthenticatedMenu, {
    ExtraSmallMenuUnauthenticated,
} from './UnauthenticatedMenu';

export const Logo = () => {
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

export interface NavbarItem {
    name: string;
    icon?: JSX.Element;
    onClick: () => void;
    children?: NavbarItem[];
}

function allStartItems(
    navigate: NavigateFunction,
    toggleExpansion: (item: string) => void,
): NavbarItem[] {
    return [
        {
            name: 'Newsfeed',
            icon: <Feed />,
            onClick: () => navigate('/newsfeed'),
        },
        {
            name: 'Training Plan',
            icon: <Checklist />,
            onClick: () => navigate('/profile?view=progress'),
        },
        {
            name: 'Scoreboard',
            icon: <Scoreboard />,
            onClick: () => navigate('/scoreboard'),
        },
        {
            name: 'Tournaments',
            icon: <Tournaments />,
            onClick: () => toggleExpansion('Tournaments'),
            children: [
                {
                    name: 'DojoLiga',
                    icon: <MilitaryTechIcon/>,
                    onClick: () => navigate('/tournaments'),
                },
                {
                    name: 'Open Classical',
                    icon: <MilitaryTechIcon/>,
                    onClick: () => navigate('/tournaments/open-classical'),
                },
            ],
        },
        {
            name: 'Games',
            icon: <PawnIcon />,
            onClick: () => navigate('/games'),
        },
        {
            name: 'Calendar',
            icon: <CalendarToday />,
            onClick: () => navigate('/calendar'),
        },
        {
            name: 'Material',
            icon: <MenuBook />,
            onClick: () => toggleExpansion('Material'),
            children: [
                {
                    name: 'Courses',
                    icon: <ImportContactsIcon/>,
                    onClick: () => navigate('/courses'),
                },
                {
                    name: 'Tactics Tests',
                    icon: <ExtensionIcon/>,
                    onClick: () => navigate('/tactics'),
                },
                {
                    name: 'Books',
                    icon: <AutoStoriesIcon/>,
                    onClick: () => navigate('/material/books'),
                },
                {
                    name: 'Sparring Positions',
                    icon: <LocalFireDepartmentIcon/>,
                    onClick: () => navigate('/material/sparring'),
                },
                {
                    name: 'Model Annotations',
                    icon: <BorderColorIcon/>,
                    onClick: () => navigate('/material/modelgames'),
                },
                {
                    name: 'Games to Memorize',
                    icon: <PsychologyIcon/>,
                    onClick: () => navigate('/material/memorizegames'),
                },
                {
                    name: 'Rating Conversions',
                    icon: <SignalCellularAltIcon/>,
                    onClick: () => navigate('/material/ratings'),
                },
            ],
        },
        {
            name: 'Clubs',
            icon: <Groups />,
            onClick: () => navigate('/clubs'),
        },
        {
            name: 'Chat',
            icon: <Forum />,
            onClick: () => navigate('/chat'),
        },
        {
            name: 'Shop',
            icon: <Sell />,
            onClick: () => toggleExpansion('Shop'),
            children: [
                {
                    name: 'Courses',
                    icon: <ImportContactsIcon/>,
                    onClick: () => navigate('/courses'),
                },
                {
                    name: 'Coaching',
                    icon: <RocketLaunchIcon/>,
                    onClick: () => navigate('/coaching'),
                },
                {
                    name: 'Merch',
                    icon: <StorefrontIcon/>,
                    onClick: () =>
                        window.open('https://www.chessdojo.shop/shop', '_blank'),
                },
            ],
        },
    ];
}

function helpItem(navigate: NavigateFunction): NavbarItem {
    return {
        name: 'Help',
        icon: <Help />,
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
                    <Notifications />
                </Badge>
            </ListItemIcon>
            <Typography textAlign='center'>Notifications</Typography>
        </MenuItem>
    );
}

export const StartItem: React.FC<{ item: NavbarItem; meetingCount: number }> = ({
    item,
    meetingCount,
}) => {
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

    if (item.name === 'Calendar') {
        return (
            <Button
                key={item.name}
                onClick={item.onClick}
                sx={{ color: 'white', whiteSpace: 'nowrap' }}
                startIcon={
                    <Badge
                        badgeContent={meetingCount}
                        color='secondary'
                        overlap='circular'
                    >
                        {item.icon}
                    </Badge>
                }
            >
                {item.name}
            </Button>
        );
    }

    return (
        <>
            <Button
                key={item.name}
                onClick={item.children ? handleOpen : item.onClick}
                sx={{ color: 'white', whiteSpace: 'nowrap' }}
                startIcon={item.icon}
                endIcon={item.children ? <ExpandMore /> : undefined}
            >
                {item.name}
            </Button>
            {item.children && (
                <Menu
                    id='submenu-appbar'
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                >
                    {item.children.map((child) => (
                        <MenuItem key={child.name} onClick={handleClick(child.onClick)}>
                            {child.icon && <ListItemIcon>{child.icon}</ListItemIcon>}
                            <Typography textAlign='center'>{child.name}</Typography>
                        </MenuItem>
                    ))}
                </Menu>
            )}
        </>
    );
};

export const NavMenuItem: React.FC<{
    item: NavbarItem;
    openItems: Record<string, boolean>;
    handleClick: (func: () => void) => () => void;
    meetingCount?: number;
}> = ({ item, openItems, handleClick, meetingCount }) => {
    return (
        <>
            <MenuItem
                key={item.name}
                onClick={item.children ? item.onClick : handleClick(item.onClick)}
            >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <Typography textAlign='center'>
                    {item.name}
                    {item.name === 'Calendar' && meetingCount ? ` (${meetingCount})` : ''}
                </Typography>
                {item.children &&
                    (openItems[item.name] ? (
                        <ListItemIcon sx={{ position: 'absolute', right: 0 }}>
                            <ExpandLess />
                        </ListItemIcon>
                    ) : (
                        <ListItemIcon sx={{ position: 'absolute', right: 0 }}>
                            <ExpandMore />
                        </ListItemIcon>
                    ))}
            </MenuItem>
            {item.children && (
                <Collapse key={item.name + '-collapse'} in={openItems[item.name]}>
                    <List component='div' disablePadding>
                        {item.children.map((child) => (
                            <MenuItem
                                key={child.name}
                                onClick={handleClick(child.onClick)}
                                sx={{ pl: 3 }}
                            >
                                {child.icon ? (
                                    <ListItemIcon>{child.icon}</ListItemIcon>
                                ) : (
                                    <ListItemIcon>
                                        <ChevronRight />
                                    </ListItemIcon>
                                )}
                                <Typography textAlign='center'>{child.name}</Typography>
                            </MenuItem>
                        ))}
                    </List>
                </Collapse>
            )}
        </>
    );
};

function HelpButton(navigate: NavigateFunction) {
    return (
        <Tooltip key='help' title='Help'>
            <IconButton
                data-cy='Help'
                key='help'
                sx={{ color: 'white' }}
                onClick={() => navigate('/help')}
            >
                <Help />
            </IconButton>
        </Tooltip>
    );
}

function useNavbarItems(
    meetingCount: number,
    handleClick: (func: () => void) => () => void,
) {
    const navigate = useNavigate();
    const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
    const auth = useAuth();

    const showAll = useMediaQuery('(min-width:1560px)');
    const hide2 = useMediaQuery('(min-width:1416px)');
    const hide3 = useMediaQuery('(min-width:1315px)');
    const hide4 = useMediaQuery('(min-width:1196px)');
    const hide5 = useMediaQuery('(min-width:1066px)');
    const hide6 = useMediaQuery('(min-width:963px)');
    const hide7 = useMediaQuery('(min-width:772px)');

    const showHelp = useMediaQuery('(min-width:624px)');
    const showNotifications = useMediaQuery('(min-width:567px)');
    const showProfileDropdown = useMediaQuery('(min-width:542px)');

    const startItems = allStartItems(navigate, (item: string) =>
        setOpenItems((v) => ({ ...v, [item]: !(v[item] || false) })),
    );

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
    } else if (hide6) {
        startItemCount = startItems.length - 6;
    } else if (hide7) {
        startItemCount = startItems.length - 7;
    } else {
        startItemCount = startItems.length - 8;
    }

    const shownStartItems: JSX.Element[] = startItems
        .slice(0, startItemCount)
        .map((item) => (
            <StartItem key={item.name} item={item} meetingCount={meetingCount} />
        ));

    const menuItems: JSX.Element[] = startItems
        .slice(startItemCount)
        .map((item) => (
            <NavMenuItem
                key={item.name}
                item={item}
                openItems={openItems}
                handleClick={handleClick}
                meetingCount={meetingCount}
            />
        ));

    const endItems: JSX.Element[] = [];

    if (showNotifications) {
        endItems.push(<NotificationButton key='notifications' />);
    } else {
        menuItems.push(
            <NotificationsMenuItem key='notifications' handleClick={handleClick} />,
        );
    }

    if (showHelp) {
        endItems.push(HelpButton(navigate));
    } else {
        menuItems.push(
            <NavMenuItem
                key='help'
                item={helpItem(navigate)}
                openItems={openItems}
                handleClick={handleClick}
            />,
        );
    }

    if (showProfileDropdown) {
        endItems.push(<ProfileButton key='profileDropdown' />);
    } else {
        menuItems.push(
            <MenuItem key='signout' onClick={handleClick(auth.signout)}>
                <ListItemIcon>
                    <Logout color='error' />
                </ListItemIcon>
                <Typography textAlign='center' color='error'>
                    Sign Out
                </Typography>
            </MenuItem>,
        );
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

const ExtraSmallMenu: React.FC<MenuProps> = ({ meetingCount }) => {
    const auth = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const { notifications } = useNotifications();
    const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

    const startItems = allStartItems(navigate, (item: string) =>
        setOpenItems((v) => ({ ...v, [item]: !(v[item] || false) })),
    );

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
            setOpenItems({});
        };
    };

    const profileCreated = hasCreatedProfile(auth.user!);

    let startItemsJsx: JSX.Element[] = [];
    if (profileCreated) {
        startItemsJsx = startItems.map((item) => (
            <NavMenuItem
                key={item.name}
                item={item}
                openItems={openItems}
                handleClick={handleClick}
                meetingCount={meetingCount}
            />
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
                            <Notifications />
                        </Badge>
                    </ListItemIcon>
                    <Typography textAlign='center'>Notifications</Typography>
                </MenuItem>

                <MenuItem onClick={handleClick(() => navigate('/help'))}>
                    <ListItemIcon>
                        <Help />
                    </ListItemIcon>
                    <Typography textAlign='center'>Help</Typography>
                </MenuItem>

                <MenuItem onClick={handleClick(auth.signout)}>
                    <ListItemIcon>
                        <Logout color='error' />
                    </ListItemIcon>
                    <Typography textAlign='center' color='error'>
                        Sign Out
                    </Typography>
                </MenuItem>
            </Menu>
        </Stack>
    );
};

const AuthenticatedMenu: React.FC<MenuProps> = ({ meetingCount }) => {
    const largeMenu = useMediaQuery('(min-width:450px)');
    if (largeMenu) {
        return <LargeMenu meetingCount={meetingCount} />;
    }
    return <ExtraSmallMenu meetingCount={meetingCount} />;
};

const NavbarMenu: React.FC<MenuProps> = ({ meetingCount }) => {
    const auth = useAuth();

    if (auth.status === AuthStatus.Loading) {
        return <Logo />;
    }
    if (auth.status === AuthStatus.Unauthenticated) {
        return <UnauthenticatedMenu />;
    }
    return <AuthenticatedMenu meetingCount={meetingCount} />;
};

export default NavbarMenu;
