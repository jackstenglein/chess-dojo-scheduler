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
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
};

/**
 * Returns the props for a MUI Avatar with the given size and name.
 * @param size The size of the Avatar in px.
 * @param name The name of the user.
 * @returns The props for the Avatar.
 */
export function avatarProps(name: string, size: number | SxSize = 74) {
    let uppercaseLetters = name.replace(/[a-z]/g, '').slice(0, 3);

    let tokens = name.split(' ');
    if (tokens.length > 1) {
        uppercaseLetters = tokens
            .slice(0, 3)
            .map((v) => v[0])
            .map((v) => v.toLocaleUpperCase())
            .join('');
    }

    if (uppercaseLetters.length === 0) {
        uppercaseLetters = name.slice(0, 1);
    }

    let height;
    let fontSize;
    if (typeof size === 'number') {
        height = `${size}px`;
        fontSize = `${(1.4 * size) / 74}rem`;
    } else {
        height = {
            xs: size.xs !== undefined ? `${size.xs}px` : undefined,
            sm: size.sm !== undefined ? `${size.sm}px` : undefined,
            md: size.md !== undefined ? `${size.md}px` : undefined,
            lg: size.lg !== undefined ? `${size.lg}px` : undefined,
            xl: size.xl !== undefined ? `${size.xl}px` : undefined,
        };
        fontSize = {
            xs: size.xs !== undefined ? `${(1.4 * size.xs) / 74}rem` : undefined,
            sm: size.sm !== undefined ? `${(1.4 * size.sm) / 74}rem` : undefined,
            md: size.md !== undefined ? `${(1.4 * size.md) / 74}rem` : undefined,
            lg: size.lg !== undefined ? `${(1.4 * size.lg) / 74}rem` : undefined,
            xl: size.xl !== undefined ? `${(1.4 * size.xl) / 74}rem` : undefined,
        };
    }

    return {
        sx: {
            bgcolor: stringToColor(name),
            height: height,
            width: height,
            fontSize: fontSize,
        },
        children: uppercaseLetters,
        alt: name,
    };
}
