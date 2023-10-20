import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Button,
    FormControlLabel,
    ListItemIcon,
    Menu,
    MenuItem,
    Stack,
    Switch,
    Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Person2Icon from '@mui/icons-material/Person2';
import SettingsIcon from '@mui/icons-material/Settings';
import NightlightIcon from '@mui/icons-material/Nightlight';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

import { useAuth } from '../auth/Auth';
import Avatar from '../profile/Avatar';
import { useLocalStorage } from '../ThemeProvider';
import { useApi } from '../api/Api';

const ProfileButton = () => {
    const auth = useAuth();
    const user = auth.user;
    const navigate = useNavigate();
    const [colorMode, setColorMode] = useLocalStorage(
        'colorMode',
        user?.enableLightMode ? 'light' : 'dark'
    );
    const api = useApi();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    if (!user) {
        return null;
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

    const toggleColorMode = () => {
        setColorMode(colorMode === 'light' ? 'dark' : 'light');
        api.updateUser({ enableLightMode: colorMode === 'dark' });
    };

    return (
        <>
            <Button data-cy='navbar-profile-button' onClick={handleOpen}>
                <Stack direction='row' alignItems='center'>
                    <Avatar user={user} size={40} />
                    <ExpandMoreIcon sx={{ color: 'white' }} />
                </Stack>
            </Button>
            <Menu
                id='profile-menu'
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <MenuItem onClick={handleClick(() => navigate('/profile?view=stats'))}>
                    <ListItemIcon>
                        <Person2Icon />
                    </ListItemIcon>
                    <Typography textAlign='center'>Profile</Typography>
                </MenuItem>

                <MenuItem onClick={handleClick(() => navigate('/profile/edit'))}>
                    <ListItemIcon>
                        <SettingsIcon />
                    </ListItemIcon>
                    <Typography textAlign='center'>Settings</Typography>
                </MenuItem>

                <MenuItem>
                    <ListItemIcon>
                        <NightlightIcon />
                    </ListItemIcon>

                    <FormControlLabel
                        value='start'
                        control={
                            <Switch
                                color='primary'
                                checked={colorMode === 'dark'}
                                onChange={toggleColorMode}
                            />
                        }
                        label='Dark Mode'
                        labelPlacement='start'
                        sx={{ ml: 0 }}
                    />
                </MenuItem>

                <MenuItem onClick={handleClick(auth.signout)}>
                    <ListItemIcon>
                        <ExitToAppIcon color='error' />
                    </ListItemIcon>
                    <Typography textAlign='center' color='error'>
                        Sign Out
                    </Typography>
                </MenuItem>
            </Menu>
        </>
    );
};

export default ProfileButton;
