import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
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
import LogoHeader from '../components/Logo';
import SocialButton from '../components/SocialButton';
import Fonts from '../assets/fonts';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../redux/store';
import { signUpUser } from '../redux/thunk/authThunk';

type Props = RootStackScreenProps<'SignUpScreen'>;

const SignUpScreen: React.FC<Props> = ({navigation}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const dispatch = useDispatch<AppDispatch>();
  const handleSignUp = () => {
    let isValid = true;

    if (!name) {
      setNameError('Name is required.');
      isValid = false;
    } else {
      setNameError('');
    }

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

    dispatch(signUpUser({name, email, password}));
    Alert.alert('Success', 'Account created successfully!');
    navigation.navigate(SCREEN_NAMES.LOGIN);
  };

  const handleGoogleSignUp = () => {
    Alert.alert('Google Sign-Up', 'Google sign-up pressed.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.inner}>
            {/* Logo */}
            <LogoHeader />

            {/* Name */}
            <CustomTextInput
              label="Name"
              mode="outlined"
              value={name}
              onChangeText={text => {
                setName(text);
                setNameError('');
              }}
              icon={<Ionicons name="person" size={20} color="#FF9800" />}
              errorMessage={nameError}
            />

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
              mode="outlined"
              label="Password"
              value={password}
              onChangeText={text => {
                setPassword(text);
                setPasswordError('');
              }}
              secureTextEntry
              icon={<Ionicons name="lock-closed" size={20} color="#FF9800" />}
              errorMessage={passwordError}
            />

            {/* Sign Up Button */}
            <CustomButton
              title="Create Account"
              onPress={handleSignUp}
              backgroundColor="#64B5F6"
              textColor="#000000"
            />

            {/* Google Sign Up */}
            <SocialButton
              icon={<GoogleIcon />}
              title="Sign Up with Google"
              onPress={handleGoogleSignUp}
            />

            {/* Navigate to Login */}
            <View style={{alignItems: 'center', marginTop: 20}}>
              <Text style={styles.linkText}>
                Already have an account?{' '}
                <Text
                  onPress={() => navigation.navigate(SCREEN_NAMES.LOGIN)}
                  style={[
                    styles.linkText,
                    {color: '#64B5F6', textDecorationLine: 'underline'},
                  ]}>
                  Log In
                </Text>
              </Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUpScreen;

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
  linkText: {
    color: Colors.WHITE,
    fontSize: 14,
    fontFamily:Fonts.LIGHT
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 20,
    width: '70%',
    alignSelf: 'center',
  },
  googleText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
