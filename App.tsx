import React, {useEffect} from 'react';
import {SafeAreaView, StyleSheet, useColorScheme} from 'react-native';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {ToastProvider} from 'react-native-toast-notifications';
import store, {persistor} from './src/redux/store';
import RootNavigation from './src/navigation';
import {PaperProvider} from 'react-native-paper';
import {DarkTheme, LightTheme} from './src/utils/theme';
import {Buffer} from 'buffer';
import messaging from '@react-native-firebase/messaging'; // ✅ Added

(global as any).Buffer = Buffer;

const App = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  useEffect(() => {
    requestUserPermission();
    getFCMToken();

    const unsubscribe = messaging().onTokenRefresh(token => {
      console.log('New FCM Token:', token);
    });

    return unsubscribe;
  }, []);

  const requestUserPermission = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Notification permission granted:', authStatus);
    } else {
      console.log('Notification permission denied');
    }
  };

  const getFCMToken = async () => {
    try {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
    } catch (error) {
      console.log('Error getting FCM token:', error);
    }
  };

  return (
    <Provider store={store}>
      <PaperProvider theme={isDarkMode ? DarkTheme : LightTheme}>
        <PersistGate loading={null} persistor={persistor}>
          <ToastProvider placement="top" duration={3000} swipeEnabled={true}>
            <SafeAreaView style={styles.container}>
              <RootNavigation />
            </SafeAreaView>
          </ToastProvider>
        </PersistGate>
      </PaperProvider>
    </Provider>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
