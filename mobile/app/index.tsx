import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';

export default function App() {
    return (
        <View style={styles.container}>
            <Link href='/settings/'>Settings</Link>
            <StatusBar style='auto' />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
