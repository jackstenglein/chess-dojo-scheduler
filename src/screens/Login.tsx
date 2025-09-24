import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import FontAwesome from '@react-native-vector-icons/fontawesome';
import {Colors, GoogleIcon, Logo} from '../assets';
import {RootStackScreenProps} from '../utils/types/navigation';
import {SCREEN_NAMES} from '../utils/types/screensName';
import CustomTextInput from '../components/CustomTextInput';
import CustomButton from '../components/CustomButton';
import LinkButton from '../components/LinkButton';
import SocialButton from '../components/SocialButton';
import {useTheme} from 'react-native-paper';
import {CustomTheme} from '../utils/theme';
import LogoHeader from '../components/Logo';
import {signIn, socialSignin} from '../services/AuthService';
import {signInUser} from '../redux/thunk/authThunk';
import {useDispatch} from 'react-redux';
import {AppDispatch} from '../redux/store';

type Props = RootStackScreenProps<'LoginScreen'>;

const LoginScreen: React.FC<Props> = ({navigation}) => {
  const [email, setEmail] = useState<string>('john@yopmail.com');
  const [password, setPassword] = useState<string>('Admin@123');
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const dispatch = useDispatch<AppDispatch>();

  const handleSignIn = async () => {
    let isValid = true;

    // Email validation
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

    // Password validation
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

    const user = await dispatch(signInUser({email, password})).unwrap();
    // console.log( "SignIn Result: ",result)
    console.log('Logging in with:', user);
    Alert.alert('Success', 'Signed in successfully!');
    navigation.navigate(SCREEN_NAMES.HOME);
  };

  const handleSignUp = () => {
    navigation.navigate(SCREEN_NAMES.SIGNUP);
  };

  const handleResetPassword = () => {
    navigation.navigate(SCREEN_NAMES.PASSWORD_RESET);
  };

  const handleGoogleSignIn = () => {
    // Alert.alert('Google Sign-In', 'Google sign-in pressed.');
    // 👉 Implement Google Sign-In here
    socialSignin('Google');
  };
  const {colors} = useTheme<CustomTheme>();
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.inner}>
            {/* Logo */}
            <LogoHeader />

            {/* Email */}
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

            {/* Password */}
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

            {/* Sign In */}
            <CustomButton
              onPress={handleSignIn}
              title="Login"
              textColor={'#000000'}
            />

            {/* Links */}
            <View style={styles.linkContainer}>
              <LinkButton onPress={handleSignUp} title="Sign Up" />
              <LinkButton
                onPress={handleResetPassword}
                title="Reset Password"
              />
            </View>

            {/* Google Sign In */}
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 24,
    color: '#fff',
    marginTop: 10,
    fontWeight: 'bold',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
});
