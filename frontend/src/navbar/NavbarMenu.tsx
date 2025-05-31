import { useNotifications } from '@/api/cache/Cache';
import { AuthStatus, useAuth } from '@/auth/Auth';
import { Link } from '@/components/navigation/Link';
import NotificationButton from '@/components/notifications/NotificationButton';
import { getConfig } from '@/config';
import { hasCreatedProfile } from '@/database/user';
import { ChessDojoIcon } from '@/style/ChessDojoIcon';
import { PawnIcon } from '@/style/ChessIcons';
import { CrossedSwordIcon } from '@/style/CrossedSwordIcon';
import { DonateIcon } from '@/style/DonateIcon';
import { FontAwesomeSvgIcon } from '@/style/Icon';
import { DiscordIcon, TwitchIcon, YoutubeIcon } from '@/style/SocialMediaIcons';
import { TournamentBracketIcon } from '@/style/TournamentIcon';
import { faPatreon } from '@fortawesome/free-brands-svg-icons';
import {
    AccountCircle,
    AutoStories,
    Biotech,
    BorderColor,
    CalendarToday,
    Checklist,
    ChevronRight,
    ExpandLess,
    ExpandMore,
    Feed,
    Forum,
    Groups,
    Help,
    ImportContacts,
    LocalFireDepartment,
    Logout,
    MenuBook,
    Menu as MenuIcon,
    MilitaryTech,
    Notifications,
    Person2 as Person2Icon,
    Psychology,
    RocketLaunch,
    Scoreboard,
    Sell,
    SignalCellularAlt,
    SmartToy,
    Speed,
    Storage,
    Storefront,
    EmojiEvents as Tournaments,
} from '@mui/icons-material';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import GroupIcon from '@mui/icons-material/Group';
import LanguageIcon from '@mui/icons-material/Language';
import SearchIcon from '@mui/icons-material/Search';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
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
import ProfileButton from './ProfileButton';
import UnauthenticatedMenu, { ExtraSmallMenuUnauthenticated } from './UnauthenticatedMenu';

const config = getConfig();

export const Logo = () => {
    return (
        <Link
            href='/'
            sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '15px',
            }}
        >
            <ChessDojoIcon sx={{ color: 'white', fontSize: { xs: '50px', md: '60px' } }} />
        </Link>
    );
};

interface MenuProps {
    meetingCount: number;
}

export interface NavbarItem {
    name: string;
    icon?: JSX.Element;
    onClick?: () => void;
    children?: Omit<NavbarItem, 'onClick'>[];
    href?: string;
    target?: '_blank';
}

function allStartItems(toggleExpansion: (item: string) => void): NavbarItem[] {
    return [
        {
            name: 'Newsfeed',
            icon: <Feed />,
            href: '/newsfeed',
        },
        {
            name: 'Training Plan',
            icon: <Checklist />,
            href: '/profile?view=progress',
        },
        {
            name: 'Scoreboard',
            icon: <Scoreboard />,
            onClick: () => toggleExpansion('Scoreboard'),
            children: [
                {
                    name: 'My Cohort',
                    icon: <GroupIcon />,
                    href: '/scoreboard',
                },
                {
                    name: 'Full Dojo',
                    icon: <LanguageIcon />,
                    href: '/scoreboard/dojo',
                },
                {
                    name: 'Followers',
                    icon: <ThumbUpIcon />,
                    href: '/scoreboard/following',
                },
                {
                    name: 'Search Users',
                    icon: <SearchIcon />,
                    href: '/scoreboard/search',
                },
                {
                    name: 'Statistics',
                    icon: <AutoGraphIcon />,
                    href: '/scoreboard/stats',
                },
            ],
        },
        {
            name: 'Tournaments',
            icon: <Tournaments />,
            onClick: () => toggleExpansion('Tournaments'),
            children: [
                {
                    name: 'Round Robin',
                    icon: <CrossedSwordIcon />,
                    href: '/tournaments/round-robin',
                },
                {
                    name: 'Open Classical',
                    icon: <TournamentBracketIcon />,
                    href: '/tournaments/open-classical',
                },
                {
                    name: 'DojoLiga',
                    icon: <MilitaryTech />,
                    href: '/tournaments/liga',
                },
            ],
        },
        {
            name: 'Games',
            icon: <PawnIcon />,
            onClick: () => toggleExpansion('Games'),
            children: [
                {
                    name: 'Analysis Board',
                    icon: <Biotech />,
                    href: '/games/import',
                },
                {
                    name: 'Full Database',
                    icon: <Storage />,
                    href: '/games',
                },
                {
                    name: 'My Games',
                    icon: <AccountCircle />,
                    href: '/profile?view=games',
                },
            ],
        },
        {
            name: 'Calendar',
            icon: <CalendarToday />,
            href: '/calendar',
        },
        {
            name: 'Material',
            icon: <MenuBook />,
            onClick: () => toggleExpansion('Material'),
            children: [
                {
                    name: 'Courses',
                    icon: <ImportContacts />,
                    href: '/courses',
                },
                {
                    name: 'Tests',
                    icon: <Speed />,
                    href: '/tests',
                },
                {
                    name: 'Books',
                    icon: <AutoStories />,
                    href: '/material/books',
                },
                {
                    name: 'Sparring Positions',
                    icon: <LocalFireDepartment />,
                    href: '/material/sparring',
                },
                {
                    name: 'Model Annotations',
                    icon: <BorderColor />,
                    href: '/material/modelgames',
                },
                {
                    name: 'Games to Memorize',
                    icon: <Psychology />,
                    href: '/material/memorizegames',
                },
                {
                    name: 'Rating Conversions',
                    icon: <SignalCellularAlt />,
                    href: '/material/ratings',
                },
                {
                    name: 'Guide to Bots',
                    icon: <SmartToy />,
                    href: '/material/bots',
                },
                {
                    name: 'Discord',
                    icon: <DiscordIcon sx={{ color: '#5865f2' }} />,
                    href: config.discord.url,
                    target: '_blank',
                },
                {
                    name: 'Twitch',
                    icon: <TwitchIcon color='twitch' />,
                    href: 'https://www.twitch.tv/chessdojo/videos',
                    target: '_blank',
                },
                {
                    name: 'YouTube',
                    icon: <YoutubeIcon color='youtube' />,
                    href: 'https://www.youtube.com/@ChessDojo',
                    target: '_blank',
                },
                {
                    name: 'Patreon',
                    icon: <FontAwesomeSvgIcon icon={faPatreon} sx={{ color: 'white' }} />,
                    href: 'https://www.patreon.com/ChessDojo',
                    target: '_blank',
                },
            ],
        },
        {
            name: 'Clubs',
            icon: <Groups />,
            href: '/clubs',
        },
        {
            name: 'Blog',
            icon: <Forum />,
            href: '/blog',
        },
        {
            name: 'Shop',
            icon: <Sell />,
            onClick: () => toggleExpansion('Shop'),
            children: [
                {
                    name: 'Courses',
                    icon: <ImportContacts />,
                    href: '/courses',
                },
                {
                    name: 'Coaching',
                    icon: <RocketLaunch />,
                    href: '/coaching',
                },
                {
                    name: 'Merch',
                    icon: <Storefront />,
                    href: 'https://www.chessdojo.shop/shop',
                    target: '_blank',
                },
                {
                    name: 'Donate',
                    href: '/donate',
                    icon: <DonateIcon />,
                },
            ],
        },
    ];
}

function helpItem(): NavbarItem {
    return {
        name: 'Help',
        icon: <Help />,
        href: '/help',
    };
}

function NotificationsMenuItem(): JSX.Element {
    const { notifications } = useNotifications();
    return (
        <MenuItem href='/notifications'>
            <ListItemIcon>
                <Badge badgeContent={notifications.length} color='secondary' overlap='circular'>
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

    if (item.name === 'Calendar') {
        return (
            <Button
                key={item.name}
                onClick={item.onClick}
                sx={{ color: 'white', whiteSpace: 'nowrap' }}
                startIcon={
                    <Badge badgeContent={meetingCount} color='secondary' overlap='circular'>
                        {item.icon}
                    </Badge>
                }
                href={item.href}
                component={Link}
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
                component={item.href ? Link : 'button'}
                href={item.href}
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
                        <MenuItem
                            key={child.name}
                            onClick={handleClose}
                            component={child.href ? Link : 'li'}
                            href={child.href}
                            target={child.target}
                        >
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
    handleClose: () => void;
    meetingCount?: number;
}> = ({ item, openItems, handleClose, meetingCount }) => {
    return (
        <>
            <MenuItem
                key={item.name}
                onClick={item.children ? item.onClick : undefined}
                component={item.href ? Link : 'li'}
                href={item.href}
            >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <Typography textAlign='center'>
                    {item.name}{' '}
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
                                onClick={handleClose}
                                sx={{ pl: 3 }}
                                component={child.href ? Link : 'li'}
                                href={child.href}
                                target={child.target}
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

function HelpButton() {
    return (
        <Tooltip key='help' title='Help'>
            <IconButton data-cy='Help' key='help' sx={{ color: 'white' }} href='/help'>
                <Help />
            </IconButton>
        </Tooltip>
    );
}

function useNavbarItems(meetingCount: number, handleClose: () => void) {
    const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
    const auth = useAuth();

    const showAll = useMediaQuery('(min-width:1615px)');
    const hide2 = useMediaQuery('(min-width:1488px)');
    const hide3 = useMediaQuery('(min-width:1370px)');
    const hide4 = useMediaQuery('(min-width:1256px)');
    const hide5 = useMediaQuery('(min-width:1120px)');
    const hide6 = useMediaQuery('(min-width:979px)');
    const hide7 = useMediaQuery('(min-width:772px)');

    const showHelp = useMediaQuery('(min-width:624px)');
    const showNotifications = useMediaQuery('(min-width:567px)');
    const showProfileDropdown = useMediaQuery('(min-width:542px)');

    const startItems = allStartItems((item: string) =>
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

    const onClose = () => {
        setOpenItems({});
        handleClose();
    };

    const shownStartItems: JSX.Element[] = startItems
        .slice(0, startItemCount)
        .map((item) => <StartItem key={item.name} item={item} meetingCount={meetingCount} />);

    const menuItems: JSX.Element[] = startItems
        .slice(startItemCount)
        .map((item) => (
            <NavMenuItem
                key={item.name}
                item={item}
                openItems={openItems}
                handleClose={onClose}
                meetingCount={meetingCount}
            />
        ));

    const endItems: JSX.Element[] = [];

    if (showNotifications) {
        endItems.push(<NotificationButton key='notifications' />);
    } else {
        menuItems.push(<NotificationsMenuItem key='notifications' />);
    }

    if (showHelp) {
        endItems.push(HelpButton());
    } else {
        menuItems.push(
            <NavMenuItem
                key='help'
                item={helpItem()}
                openItems={openItems}
                handleClose={onClose}
            />,
        );
    }

    if (showProfileDropdown) {
        endItems.push(<ProfileButton key='profileDropdown' />);
    } else {
        menuItems.push(
            <MenuItem
                key='signout'
                onClick={() => {
                    auth.signout();
                    onClose();
                }}
            >
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

const LargeMenu = ({ meetingCount }: MenuProps) => {
    const auth = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const { startItems, menuItems, endItems } = useNavbarItems(meetingCount, handleClose);
    const profileCreated = hasCreatedProfile(auth.user);

    if (!profileCreated) {
        return (
            <>
                <Logo />
                <Stack spacing={1} direction='row' sx={{ flexGrow: 1 }}>
                    <Button href='/profile' sx={{ color: 'white' }} startIcon={<Person2Icon />}>
                        Profile
                    </Button>
                </Stack>

                <Button href='/help' sx={{ color: 'white' }}>
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

const ExtraSmallMenu = ({ meetingCount }: MenuProps) => {
    const auth = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const { notifications } = useNotifications();
    const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

    const startItems = allStartItems((item: string) =>
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
        setOpenItems({});
    };

    const profileCreated = hasCreatedProfile(auth.user);

    let startItemsJsx: JSX.Element[] = [];
    if (profileCreated) {
        startItemsJsx = startItems.map((item) => (
            <NavMenuItem
                key={item.name}
                item={item}
                openItems={openItems}
                handleClose={handleClose}
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
                    <MenuItem component={Link} href='/profile'>
                        <ListItemIcon>
                            <Person2Icon />
                        </ListItemIcon>
                        <Typography textAlign='center'>Profile</Typography>
                    </MenuItem>
                )}

                {startItemsJsx}

                <MenuItem component={Link} href='/notifications'>
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

                <MenuItem component={Link} href='/help'>
                    <ListItemIcon>
                        <Help />
                    </ListItemIcon>
                    <Typography textAlign='center'>Help</Typography>
                </MenuItem>

                <MenuItem
                    onClick={() => {
                        auth.signout();
                        handleClose();
                    }}
                >
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

const AuthenticatedMenu = ({ meetingCount }: MenuProps) => {
    const largeMenu = useMediaQuery('(min-width:450px)');
    if (largeMenu) {
        return <LargeMenu meetingCount={meetingCount} />;
    }
    return <ExtraSmallMenu meetingCount={meetingCount} />;
};

const NavbarMenu = ({ meetingCount }: MenuProps) => {
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
