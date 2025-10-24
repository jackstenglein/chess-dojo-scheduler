import React, {useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  useColorScheme,
  StatusBar,
  Platform,
} from 'react-native';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {ToastProvider} from 'react-native-toast-notifications';
import store, {persistor} from './src/redux/store';
import RootNavigation from './src/navigation';
import {PaperProvider} from 'react-native-paper';
import {DarkTheme, LightTheme} from './src/utils/theme';
import {Buffer} from 'buffer';
import messaging from '@react-native-firebase/messaging';
import firebase from '@react-native-firebase/app';
import SystemNavigationBar from 'react-native-system-navigation-bar';

(global as any).Buffer = Buffer;

const App = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const firebaseConfig = {
    apiKey: 'AIzaSyDhVd5ZEMufsKeE_oskOsPUjVFaA9cpSzM',
    appId: '1:994091266539:ios:b5b664a06817aa063d29ae',
    projectId: 'chess-dojo-scheduler',
    storageBucket: 'chess-dojo-scheduler.firebasestorage.app',
  };

  if (!firebase.apps.length) {
    console.log('Initializing Firebase...');
    firebase.initializeApp(firebaseConfig);
  }

  useEffect(() => {
    requestUserPermission();

    // ✅ Set black navigation bar for Android
    if (Platform.OS === 'android') {
      SystemNavigationBar.setNavigationColor('#000000', 'light'); // 'light' = white icons
    }
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

  return (
    <Provider store={store}>
      <PaperProvider theme={isDarkMode ? DarkTheme : LightTheme}>
        <PersistGate loading={null} persistor={persistor}>
          <ToastProvider placement="top" duration={3000} swipeEnabled={true}>
            {/* ✅ Top status bar */}
            <StatusBar
              backgroundColor="#000000"
              barStyle="light-content"
              translucent={false}
            />

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
    backgroundColor: '#000000', // optional to blend with bars
  },
});
