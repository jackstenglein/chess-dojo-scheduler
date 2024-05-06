import { Checkbox, Divider, FormControlLabel, Stack, Typography } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { UserNotificationSettings } from '../../database/user';
import WebAssetIcon from '@mui/icons-material/WebAsset';
import { DiscordIcon } from '../info/DiscordChip';
import EmailIcon from '@mui/icons-material/Email';
function getSettingValue(
    notificationSettings: UserNotificationSettings,
    path: string
): boolean {
    const components = path.split('.');

    let currentSetting: any = notificationSettings;
    for (const component of components) {
        if (currentSetting === undefined || currentSetting === null) {
            return false;
        }
        currentSetting = currentSetting[component];
    }
    return Boolean(currentSetting);
}

function setSettingValue(
    notificationSettings: UserNotificationSettings,
    path: string,
    value: boolean
): UserNotificationSettings {
    const components = path.split('.');
    const result = Object.assign({}, notificationSettings);

    let currentResultSetting: any = result;
    let currentOriginalSetting: any = notificationSettings;

    for (let i = 0; i < components.length - i; i++) {
        const component = components[i];
        currentResultSetting[component] = { ...currentOriginalSetting[component] };

        currentResultSetting = currentResultSetting[component];
        currentOriginalSetting = currentOriginalSetting[component];
    }

    currentResultSetting[components[components.length - 1]] = value;

    return result;
}

interface NotificationSettingsSection {
    label: string;
    settings: Array<{ label: string; path: string }>;
    icon: React.ReactNode;
}

const sections: NotificationSettingsSection[] = [
    {
        label: 'Site',
        icon: <WebAssetIcon style={{ verticalAlign: 'middle', marginRight: '0.1em' }}/>,
        settings: [
            {
                label: 'Notify me when a comment is added to my game',
                path: 'siteNotificationSettings.disableGameComment',
            },
            {
                label: 'Notify me when I have a new follower',
                path: 'siteNotificationSettings.disableNewFollower',
            },
            {
                label: 'Notify me when a comment is added to my newsfeed activity',
                path: 'siteNotificationSettings.disableNewsfeedComment',
            },
            {
                label: 'Notify me when a reaction is added to my newsfeed activity',
                path: 'siteNotificationSettings.disableNewsfeedReaction',
            },
        ],
    },
    {
        label: 'Discord',
        icon: <DiscordIcon />,
        settings: [
            {
                label: 'Notify me via a Discord DM when my meeting is booked',
                path: 'discordNotificationSettings.disableMeetingBooking',
            },
            {
                label: 'Notify me via a Discord DM when my meeting is cancelled',
                path: 'discordNotificationSettings.disableMeetingCancellation',
            },
        ],
    },
    {
        label: 'Email',
        icon: <EmailIcon style={{ verticalAlign: 'middle', marginRight: '0.1em' }}/>,
        settings: [
            {
                label: 'Notify me via email when I am about to be marked inactive',
                path: 'emailNotificationSettings.disableInactiveWarning',
            },
            {
                label: 'Subscribe to the monthly Dojo Digest',
                path: 'emailNotificationSettings.disableNewsletter',
            },
        ],
    },
];

interface NotificationSettingsEditorProps {
    notificationSettings: UserNotificationSettings;
    setNotificationSettings: (value: UserNotificationSettings) => void;
}

const NotificationSettingsEditor: React.FC<NotificationSettingsEditorProps> = ({
    notificationSettings,
    setNotificationSettings,
}) => {
    return (
        <Stack spacing={2}>
            <Stack
                id='notifications'
                sx={{
                    scrollMarginTop: 'calc(var(--navbar-height) + 8px)',
                }}
            >
                <Typography variant='h5'> <NotificationsIcon style={{ verticalAlign: 'middle', marginRight: '0.1em' }}/> Notifications</Typography>
                <Divider />
            </Stack>

            {sections.map((s) => (
                <Stack key={s.label} spacing={0.5}>
                    <Typography
                        id={`notifications-${s.label.toLowerCase()}`}
                        variant='h6'
                        sx={{
                            scrollMarginTop: '88px',
                        }}
                    >
                        {s.icon } {s.label}
                    </Typography>
                    

                    {s.settings.map((setting) => (
                        <FormControlLabel
                            key={setting.path}
                            control={
                                <Checkbox
                                    checked={
                                        !getSettingValue(
                                            notificationSettings,
                                            setting.path
                                        )
                                    }
                                    onChange={(e) =>
                                        setNotificationSettings(
                                            setSettingValue(
                                                notificationSettings,
                                                setting.path,
                                                !e.target.checked
                                            )
                                        )
                                    }
                                />
                            }
                            label={setting.label}
                        />
                    ))}
                </Stack>
            ))}
        </Stack>
    );
};

export default NotificationSettingsEditor;
