import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {GoogleIcon} from '../assets';
import {RootStackScreenProps} from '../utils/types/navigation';
import {SCREEN_NAMES} from '../utils/types/screensName';
import CustomTextInput from '../components/CustomTextInput';
import CustomButton from '../components/CustomButton';
import LinkButton from '../components/LinkButton';
import SocialButton from '../components/SocialButton';
import {useTheme} from 'react-native-paper';
import {CustomTheme} from '../utils/theme';
import LogoHeader from '../components/Logo';
import {signInUser} from '../redux/thunk/authThunk';
import {useDispatch} from 'react-redux';
import {AppDispatch} from '../redux/store';
import AlertService from '../services/ToastService';
import {decryptObject, encryptObject} from '../utils/base64Helper';

type Props = RootStackScreenProps<'LoginScreen'>;

const LoginScreen: React.FC<Props> = ({navigation}) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const dispatch = useDispatch<AppDispatch>();
  const {colors} = useTheme<CustomTheme>();

  const handleSignIn = async () => {
    try {
      let isValid = true;

      if (!email) {
        setEmailError('Email is required.');
        isValid = false;
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          setEmailError('Enter a valid email address.');
          isValid = false;
        } else {
          setEmailError('');
        }
      }

      if (!password) {
        setPasswordError('Password is required.');
        isValid = false;
      } else if (password.length < 6) {
        setPasswordError('Password must be at least 6 characters.');
        isValid = false;
      } else {
        setPasswordError('');
      }

      if (!isValid) return;

      setLoading(true);
      const user = await dispatch(signInUser({email, password})).unwrap();

      AlertService.toastPrompt(
        'Success::Signed in successfully!',
        '',
        'success',
      );

      if (user.user) navigation.navigate(SCREEN_NAMES.HOME, {email, password});
    } catch (error) {
      AlertService.toastPrompt(`Error::${error?.message}`, '', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => navigation.navigate(SCREEN_NAMES.SIGNUP);

  const handleResetPassword = () =>
    navigation.navigate(SCREEN_NAMES.PASSWORD_RESET);

  const handleGoogleSignIn = () => {
    navigation.navigate(SCREEN_NAMES.HOME, {
      email: 'email',
      password: 'password',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FF9800" />
        </View>
      </Modal>

      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.inner}>
            <LogoHeader />

            <CustomTextInput
              label="Email"
              mode="outlined"
              value={email}
              onChangeText={text => {
                setEmail(text);
                setEmailError('');
              }}
              keyboardType="email-address"
              icon={<Ionicons name="mail" size={20} color="#FF9800" />}
              errorMessage={emailError}
            />

            <CustomTextInput
              label="Password"
              mode="outlined"
              value={password}
              onChangeText={text => {
                setPassword(text);
                setPasswordError('');
              }}
              secureTextEntry
              icon={<Ionicons name="lock-closed" size={20} color="#FF9800" />}
              errorMessage={passwordError}
            />

            <CustomButton
              onPress={handleSignIn}
              title="Login"
              textColor={'#000000'}
            />

            <View style={styles.linkContainer}>
              <LinkButton onPress={handleSignUp} title="Sign Up" />
              <LinkButton
                onPress={handleResetPassword}
                title="Reset Password"
              />
            </View>

            <SocialButton
              icon={<GoogleIcon />}
              title="Sign In with Google"
              onPress={handleGoogleSignIn}
            />
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  // ✅ loader styles
  loaderContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
