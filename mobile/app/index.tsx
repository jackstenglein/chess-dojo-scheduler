import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

export default function Index() {
    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <WebView
                    //   ref={webviewRef}
                    source={{
                        uri: 'https://www.chessdojo.club/signin',
                        //   email === 'email' && password === 'password'
                        // ? BaseUrl +
                        //   `signin/?isSocialFromMobile=true&values=${encodedCredentials}`
                        // : BaseUrl + `?values=${encodedCredentials}`,
                    }}
                    javaScriptEnabled
                    domStorageEnabled
                    startInLoadingState
                    scalesPageToFit={false}
                    userAgent='Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
                    // injectedJavaScript={injectedJavaScript}
                    // onLoadStart={() => setLoading(true)}
                    // onLoadEnd={() => setLoading(false)}
                    // onError={onError}
                    // onMessage={onMessage}
                    // onNavigationStateChange={onNavigationStateChange}
                    allowsBackForwardNavigationGestures
                    cacheEnabled
                    sharedCookiesEnabled
                />
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
});
