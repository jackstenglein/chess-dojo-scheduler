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
import {RootStackScreenProps} from '../utils/types/navigation';
import {SCREEN_NAMES} from '../utils/types/screensName';
import CustomTextInput from '../components/CustomTextInput';
import CustomButton from '../components/CustomButton';
import LogoHeader from '../components/Logo';
import { forgotPassword } from '../services/AuthService';

type Props = RootStackScreenProps<'PasswordResetScreen'>;

const PasswordResetScreen: React.FC<Props> = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleSendEmail = () => {
    if (!email) {
      setEmailError('Email is required.');
      return;
    }

    // Basic email regex for format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setEmailError(''); // clear error when valid
    forgotPassword(email)
      .then(() => {
        Alert.alert('Email Sent', 'Check your inbox for reset instructions.');
        navigation.navigate(SCREEN_NAMES.RECOVERY_CODE, { email });
      })
      .catch(err => {
        Alert.alert('Error', 'Failed to send password reset email.');
      });
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
            {/* Instruction */}
            <Text
              style={{
                color: '#fff',
                fontSize: 15,
                paddingVertical: 5,
                textAlign: 'center',
                letterSpacing: 1,
              }}>
              Enter your email, and we'll send you a code to reset your
              password.
            </Text>

            {/* Email */}
            <CustomTextInput
              label="Email"
              mode="outlined"
              value={email}
              onChangeText={text => {
                setEmail(text);
                setEmailError(''); // clear while typing
              }}
              keyboardType="email-address"
              icon={<Ionicons name="mail" size={20} color="#FF9800" />}
              errorMessage={emailError} // ✅ shows error below input
            />

            {/* Send Email */}
            <CustomButton
              onPress={handleSendEmail}
              title="Send Email"
              textColor="#000000"
            />

            {/* Cancel */}
            <View style={styles.linkContainer}>
              <Text
                style={styles.linkText}
                onPress={() => navigation.navigate(SCREEN_NAMES.LOGIN)}>
                Cancel
              </Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PasswordResetScreen;

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
  input: {
    marginBottom: 15,
    backgroundColor: '#111',
    color: '#FFF',
  },
  signInButton: {
    backgroundColor: '#64B5F6',
    paddingVertical: 5,
    borderRadius: 8,
    marginVertical: 15,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  linkText: {
    color: '#64B5F6',
    fontSize: 14,
  },
});
