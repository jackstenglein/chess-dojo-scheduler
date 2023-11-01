import {
    ViewStyle,
    RegisteredStyle,
    RecursiveArray,
    Falsy,
    Animated,
} from 'react-native';
import { Surface } from 'react-native-paper';

interface StackProps {
    direction?: 'row' | 'column';
    spacing?: number;
    style?:
        | false
        | ViewStyle
        | RegisteredStyle<ViewStyle>
        | RecursiveArray<Falsy | ViewStyle | RegisteredStyle<ViewStyle>>;
}

const Stack: React.FC<React.PropsWithChildren<StackProps>> = ({
    direction = 'column',
    spacing = 0,
    children,
    style,
}) => {
    const spacingPx = 8 * spacing;

    return (
        <Surface
            elevation={0}
            style={[
                {
                    display: 'flex',
                    flexDirection: direction,
                    columnGap: direction === 'row' ? spacingPx : 0,
                    rowGap: direction === 'column' ? spacingPx : 0,
                },
                style,
            ]}
        >
            {children}
        </Surface>
    );
};

export default Stack;
