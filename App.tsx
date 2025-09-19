import React from 'react';
import {SafeAreaView, StyleSheet, useColorScheme} from 'react-native';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {ToastProvider} from 'react-native-toast-notifications';
import store, {persistor} from './src/redux/store';
import RootNavigation from './src/navigation';
import {PaperProvider} from 'react-native-paper';
import {DarkTheme, LightTheme} from './src/utils/theme';

const App = () => {
  const colorScheme = useColorScheme(); 
  const isDarkMode = colorScheme === 'dark';

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
