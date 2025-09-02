import Stack from 'src/components/Stack';
import { ActivityIndicator } from 'react-native-paper';

const LoadingPage = () => {
    return (
        <Stack
            style={{
                paddingTop: 6,
                paddingBottom: 4,
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <ActivityIndicator animating={true} />
        </Stack>
    );
};

export default LoadingPage;
