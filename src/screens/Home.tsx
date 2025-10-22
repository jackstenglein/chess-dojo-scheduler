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
import {WebView, WebViewNavigation} from 'react-native-webview';
import {BaseUrl, Secret} from '../utils/baseUrl';
import {useDispatch, useSelector} from 'react-redux';
import AlertService from '../services/ToastService';
import {decryptObject, encryptObject} from '../utils/base64Helper';
import {signOutUser} from '../redux/thunk/authThunk';
import {AppDispatch} from '../redux/store';
import {SCREEN_NAMES} from '../utils/types/screensName';
import messaging from '@react-native-firebase/messaging';
import {onTokenRefresh, getToken} from '@react-native-firebase/messaging';

interface HomeScreenProps {
  navigation: any;
  route: {params?: {email?: string | undefined; password?: string | undefined}};
}

const HomeScreen = ({navigation, route}: HomeScreenProps) => {
  const webviewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [token, setFcmToken] = useState('');
  const [encodedCredentials, setEncodedCredentials] = useState<string | null>(
    null,
  );
  const {user} = useSelector((state: any) => state.auth);
  const {email, password} = route.params || {email: '', password: ''};
  const dispatch = useDispatch<AppDispatch>();
  const hasRedirected = useRef(false);

  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'LOGOUT') {
        AlertService.toastPrompt('Info', 'Logging out...');
        navigation.navigate('LoginScreen');
      }
    } catch (e) {
      console.warn('Invalid message received:', event.nativeEvent.data);
      AlertService.toastPrompt(
        'Warning',
        'Invalid message received from webpage.',
      );
    }
  };

  const getFCMToken = async () => {
    try {
      const newToken = await messaging().getToken();
      if (newToken && newToken !== token) {
        setFcmToken(newToken);
      }
    } catch (error) {
      console.log('Error getting FCM token:', error);
    }
  };

  useEffect(() => {
    getFCMToken();
    const unsubscribe = onTokenRefresh(messaging(), newToken => {
      setFcmToken(newToken);
    });
    return unsubscribe;
  }, []);

  const onNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      const {url} = navState;

      if (url.includes('redirect=app') && !hasRedirected.current) {
        hasRedirected.current = true;
        setCanGoBack(navState.canGoBack);
        dispatch(signOutUser());
        navigation.navigate(SCREEN_NAMES.LOGIN, {
          email: 'email',
          password: 'password',
        });
      } else {
        setCanGoBack(navState.canGoBack);
      }
    },
    [dispatch, navigation],
  );

  const onError = useCallback(() => {
    setError(true);
    setLoading(false);
  }, []);

  const injectedJavaScript = `
    (function() {
      var meta = document.createElement('meta'); 
      meta.setAttribute('name', 'viewport'); 
      meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
      document.getElementsByTagName('head')[0].appendChild(meta);
    })();
    true;
  `;

  useEffect(() => {
    const backAction = () => {
      // if (email === 'email' && password === 'password') {
      //   if (navigation.canGoBack()) {
      //     navigation.goBack();
      //     return true;
      //   }
      // }

      if (canGoBack && webviewRef.current) {
        webviewRef.current.goBack();
        return true;
      }

      Alert.alert('Exit App', 'Do you want to exit?', [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Exit', onPress: () => BackHandler.exitApp()},
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return () => backHandler.remove();
  }, [canGoBack, email, password, navigation]);

  useEffect(() => {
    if (!email) {
      dispatch(signOutUser());
      navigation.navigate(SCREEN_NAMES.LOGIN);
    }
  }, [email]);

  useEffect(() => {
    if (!token) return;

    const handleEncryption = async () => {
      try {
        const payload =
          email === 'email' && password === 'password'
            ? {token}
            : {email: email ?? '', password: password ?? '', token};

        const encrypted = await encryptObject(payload, Secret);
        if (encrypted?.iv && encrypted?.encryptedData) {
          setEncodedCredentials(`${encrypted.iv}/${encrypted.encryptedData}`);
        }
      } catch (err) {
        console.error('Encryption/Decryption Error:', err);
      }
    };

    handleEncryption();
  }, [email, password, token]);
  console.log(
    'URLSSSS===>',
    email === 'email' && password === 'password'
      ? BaseUrl + `signin/?isSocialFromMobile=true&values=${encodedCredentials}`
      : BaseUrl + `?values=${encodedCredentials}`,
  );
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
          source={{
            uri:
              email === 'email' && password === 'password'
                ? BaseUrl +
                  `signin/?isSocialFromMobile=true&values=${encodedCredentials}`
                : BaseUrl + `?values=${encodedCredentials}`,
          }}
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
