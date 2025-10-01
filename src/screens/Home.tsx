// src/screens/HomeScreen.tsx
import React, {useRef, useState, useCallback, useEffect} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  View,
  Text,
  BackHandler,
  Alert,
} from 'react-native';
import {WebView} from 'react-native-webview';
import {BaseUrl, BaseUrlWithToken} from '../utils/baseUrl';
import {useSelector} from 'react-redux';
import AlertService from '../services/ToastService';

interface HomeScreenProps {
  navigation: any;
  route: {params?: {email?: string; password?: string}};
}

const HomeScreen = ({navigation, route}: HomeScreenProps) => {
  const webviewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const {user, token} = useSelector((state: any) => state.auth);
  const {email, password} = route.params || {email: '', password: ''};

  // ✅ Handle messages from the webpage
  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);


      if (data.type === 'LOGOUT') {
  AlertService.toastPrompt('Info', 'Logging out...');
        navigation.navigate('LoginScreen');
      }
    } catch (e) {
      console.warn('Invalid message received:', event.nativeEvent.data);
      AlertService.toastPrompt('Warning', 'Invalid message received from webpage.');
    }
  };

  // ✅ Handle navigation changes
  const onNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
  };

  // ✅ Handle error
  const onError = useCallback(() => {
    setError(true);
    setLoading(false);
  }, []);

  // ✅ Inject viewport meta for responsiveness
  const injectedJavaScript = `
    (function() {
      var meta = document.createElement('meta'); 
      meta.setAttribute('name', 'viewport'); 
      meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
      document.getElementsByTagName('head')[0].appendChild(meta);
    })();
    true;
  `;

  // ✅ Handle Android hardware back press
  useEffect(() => {
    const backAction = () => {
      if (canGoBack && webviewRef.current) {
        webviewRef.current.goBack();
        return true; // prevent app from exiting
      } else {
        Alert.alert('Exit App', 'Do you want to exit?', [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Exit', onPress: () => BackHandler.exitApp()},
        ]);
        return true;
      }
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [canGoBack]);

  return (
    <SafeAreaView style={styles.container}>
      {loading && !error && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ Failed to load page</Text>
        </View>
      ) : (
        <WebView
          ref={webviewRef}
          source={{uri: BaseUrlWithToken + `/?email=${email}&pass=${password}`}} // Replace with your URL
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          scalesPageToFit={false}
          userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
          injectedJavaScript={injectedJavaScript}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={onError}
          onMessage={onMessage}
          onNavigationStateChange={onNavigationStateChange}
          allowsBackForwardNavigationGestures
          cacheEnabled
          sharedCookiesEnabled
        />
      )}
    </SafeAreaView>
  );
};

HomeScreen.route = 'HomeScreen';
export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    // marginTop:20
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{translateX: -30}, {translateY: -30}],
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
});
