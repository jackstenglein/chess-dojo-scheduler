import { Avatar as MuiAvatar } from '@mui/material';
import { getConfig } from '../config';
import { User } from '../database/user';

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
    size?: number | SxSize;

    /**
     * The size of the text if there is no image. Only used if size is of type SxSize.
     */
    fontSize?: SxSize;

    /**
     * If provided, this overrides all other parameters to display this image URL instead.
     */
    url?: string;
}

const Avatar: React.FC<AvatarProps> = ({
    user,
    username,
    displayName,
    size,
    fontSize,
    url,
}) => {
    if (user) {
        username = user.username;
        displayName = user.displayName;
    }

    if (url === undefined) {
        url = `${picturesBucket}/profile/${username}`;
    }

    return <MuiAvatar src={url} {...avatarProps(displayName || '', size, fontSize)} />;
};

export default Avatar;

/**
 * Converts the given string to a color.
 * Copied from https://mui.com/material-ui/react-avatar/#letter-avatars
 */
function stringToColor(string: string) {
    let hash = 0;
    let i;

    for (i = 0; i < string.length; i += 1) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = '#';

    for (i = 0; i < 3; i += 1) {
        const value = (hash >> (i * 8)) & 0xff;
        color += `00${value.toString(16)}`.slice(-2);
    }

    return color;
}

export type SxSize = {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
};

/**
 * Returns the props for a MUI Avatar with the given size and name.
 * @param size The size of the Avatar in px.
 * @param name The name of the user.
 * @returns The props for the Avatar.
 */
export function avatarProps(name: string, size: number | SxSize = 74, fontSize?: SxSize) {
    let uppercaseLetters = name.replace(/[a-z]/g, '').slice(0, 3);

    let tokens = name.split(' ');
    if (tokens.length > 1) {
        uppercaseLetters = tokens
            .slice(0, 3)
            .map((v) => v[0])
            .map((v) => v?.toLocaleUpperCase() || '')
            .join('');
    }

    if (uppercaseLetters.length === 0) {
        uppercaseLetters = name.slice(0, 1);
    }

    let height;
    let chosenFontSize;
    if (typeof size === 'number') {
        height = `${size}px`;
        chosenFontSize = `${(1.4 * size) / 74}rem`;
    } else {
        height = {
            xs: size.xs !== undefined ? size.xs : undefined,
            sm: size.sm !== undefined ? size.sm : undefined,
            md: size.md !== undefined ? size.md : undefined,
            lg: size.lg !== undefined ? size.lg : undefined,
            xl: size.xl !== undefined ? size.xl : undefined,
        };
        chosenFontSize = {
            xs: fontSize?.xs !== undefined ? fontSize.xs : undefined,
            sm: fontSize?.sm !== undefined ? fontSize.sm : undefined,
            md: fontSize?.md !== undefined ? fontSize.md : undefined,
            lg: fontSize?.lg !== undefined ? fontSize.lg : undefined,
            xl: fontSize?.xl !== undefined ? fontSize.xl : undefined,
        };
    }

    return {
        sx: {
            bgcolor: stringToColor(name),
            height: height,
            width: height,
            fontSize: chosenFontSize,
        },
        children: uppercaseLetters,
        alt: name,
    };
}
