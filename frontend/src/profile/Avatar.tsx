import { Avatar as MuiAvatar } from '@mui/material';

import { User } from '../database/user';
import { getConfig } from '../config';
import { avatarProps } from '../style/style';
import { useCache } from '../api/cache/Cache';

const picturesBucket = getConfig().media.picturesBucket;

interface AvatarProps {
    /** The user to display an Avatar for. If provided, it overrides username and displayName. */
    user?: User;

    /** The username to display an Avatar for. */
    username?: string;

    /**
     * The displayName of the Avatar. If provided, the Avatar will fallback to displaying the
     * initials if the image cannot be loaded.
     */
    displayName?: string;

    /**
     * The size in px of the image.
     * @default 74
     */
    size?: number;

    /**
     * If provided, this overrides user and username to display this image URL instead.
     */
    url?: string;
}

const Avatar: React.FC<AvatarProps> = ({ user, username, displayName, size, url }) => {
    const { imageBypass } = useCache();

    if (user) {
        username = user.username;
        displayName = user.displayName;
    }

    if (url === undefined) {
        url = `${picturesBucket}/profile/${username}`;
        if (imageBypass) {
            url += `?${imageBypass}`;
        }
    }

    return <MuiAvatar src={url} {...avatarProps(displayName || '', size)} />;
};

export default Avatar;
