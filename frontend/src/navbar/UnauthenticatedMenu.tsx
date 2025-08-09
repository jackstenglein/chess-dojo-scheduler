'use client';

import { barlowCondensed } from '@/components/landing/fonts';
import { DonateIcon } from '@/style/DonateIcon';
import { fontFamily } from '@/style/font';
import {
    ChevronRight,
    ExpandLess,
    ExpandMore,
    Forum,
    ImportContacts,
    Menu as MenuIcon,
    RocketLaunch,
    Sell,
    Storefront,
    EmojiEvents as Tournaments,
} from '@mui/icons-material';
import LoginIcon from '@mui/icons-material/Login';
import SensorOccupiedIcon from '@mui/icons-material/SensorOccupied';
import {
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
import React, { useState, type JSX } from 'react';
import { Logo, NavMenuItem, NavbarItem, StartItem } from './NavbarMenu';

const UnauthenticatedMenu = () => {
    const largeMenu = useMediaQuery('(min-width:450px)');
    if (largeMenu) {
        return <LargeMenuUnauthenticated />;
    }
    return <ExtraSmallMenuUnauthenticated />;
};

export default UnauthenticatedMenu;

function unauthenticatedStartItems(toggleExpansion: (item: string) => void): NavbarItem[] {
    return [
        {
            name: 'Tournaments',
            icon: <Tournaments />,
            href: '/tournaments',
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

function useNavbarItems(handleClose: () => void) {
    const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

    const showAll = useMediaQuery('(min-width:785px)');
    const hide2 = useMediaQuery('(min-width:640px)');
    const hide3 = useMediaQuery('(min-width:400px)');
    const hide4 = useMediaQuery('(min-width:400px)');

    const startItems = unauthenticatedStartItems((item: string) =>
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
    }

    const shownStartItems: JSX.Element[] = startItems
        .slice(0, startItemCount)
        .map((item) => <StartItem key={item.name} item={item} meetingCount={0} />);

    const menuItems: JSX.Element[] = startItems
        .slice(startItemCount)
        .map((item) => (
            <NavMenuItem
                key={item.name}
                item={item}
                openItems={openItems}
                handleClose={handleClose}
            />
        ));

    return {
        startItems: shownStartItems,
        menuItems: menuItems,
    };
}

export const LargeMenuUnauthenticated = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const { startItems, menuItems } = useNavbarItems(handleClose);

    return (
        <>
            <Logo />
            <Typography
                component='a'
                href='/'
                sx={{
                    fontFamily: (theme) => fontFamily(theme, barlowCondensed),
                    fontSize: '2rem',
                    fontWeight: '600',
                    letterSpacing: '2%',
                    textDecoration: 'none',
                }}
                color='white'
            >
                ChessDojo
            </Typography>

            <Stack spacing={1} direction='row' sx={{ flexGrow: 1, justifyContent: 'end' }}>
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

                <Button href='/signin' color='dojoOrange' sx={{ fontWeight: 'bold' }}>
                    Sign In
                </Button>
                <Button href='/signup' color='dojoOrange' sx={{ fontWeight: 'bold' }}>
                    Sign Up
                </Button>
            </Stack>
        </>
    );
};

export const ExtraSmallMenuUnauthenticated = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

    const startItems = unauthenticatedStartItems((item: string) =>
        setOpenItems((v) => ({ ...v, [item]: !(v[item] || false) })),
    );

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
        setOpenItems({});
    };

    return (
        <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='center'
            sx={{ flexGrow: 1, height: 1 }}
        >
            <Stack direction='row' alignItems='center'>
                <Logo />
                <Typography
                    component='a'
                    href='/'
                    sx={{
                        fontFamily: (theme) => fontFamily(theme, barlowCondensed),
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        letterSpacing: '2%',
                        textDecoration: 'none',
                    }}
                    color='white'
                >
                    ChessDojo
                </Typography>
            </Stack>
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
                <MenuItem component='a' href='/signin'>
                    <ListItemIcon>
                        <LoginIcon />
                    </ListItemIcon>
                    <Typography textAlign='center'>Sign In</Typography>
                </MenuItem>
                <MenuItem component='a' href='/signup'>
                    <ListItemIcon>
                        <SensorOccupiedIcon />
                    </ListItemIcon>
                    <Typography textAlign='center'>Sign Up</Typography>
                </MenuItem>

                {startItems.map((item) => [
                    <MenuItem
                        key={item.name}
                        onClick={item.children ? item.onClick : undefined}
                        component={item.href ? 'a' : 'li'}
                        href={item.href}
                    >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <Typography textAlign='center'>{item.name}</Typography>
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
                    </MenuItem>,
                    item.children ? (
                        <Collapse in={openItems[item.name]}>
                            <List component='div' disablePadding>
                                {item.children.map((child) => (
                                    <MenuItem
                                        key={child.name}
                                        onClick={handleClose}
                                        component={child.href ? 'a' : 'li'}
                                        href={child.href}
                                        target={child.target}
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
                    ) : null,
                ])}
            </Menu>
        </Stack>
    );
};
