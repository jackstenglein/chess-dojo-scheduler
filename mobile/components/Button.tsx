import { Button as PaperButton, useTheme } from 'react-native-paper';

type PaperButtonProps = React.ComponentProps<typeof PaperButton>;

interface ButtonProps extends PaperButtonProps {
    color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

interface ButtonStyle {
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
}

const Button: React.FC<React.PropsWithChildren<ButtonProps>> = (props: ButtonProps) => {
    const theme = useTheme();
    const { color = 'primary', mode = 'contained', ...rest } = props;

    // contained style
    let style: ButtonStyle = {
        backgroundColor: (theme.colors as any)[`${color}`] || theme.colors.primary,
        textColor:
            (theme.colors as any)[`on${color[0].toUpperCase()}${color.slice(1)}`] ||
            theme.colors.onPrimary,
        borderColor: undefined,
    };

    if (mode === 'outlined') {
        style = {
            textColor: (theme.colors as any)[color] || theme.colors.primary,
            borderColor: (theme.colors as any)[color] || theme.colors.outline,
        };
    }

    return (
        <PaperButton
            textColor={style.textColor}
            mode={mode}
            {...rest}
            style={[style, rest.style]}
        ></PaperButton>
    );
};

export default Button;
