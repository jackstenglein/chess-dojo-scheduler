import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Alert,
} from 'react-native';
import {Colors} from '../assets';
import CustomTextInput from '../components/CustomTextInput';
import CustomButton from '../components/CustomButton';
import Fonts from '../assets/fonts';
import LogoHeader from '../components/Logo';
import {RootStackScreenProps} from '../utils/types/navigation';
import {SCREEN_NAMES} from '../utils/types/screensName';
import {forgotPasswordConfirm} from '../services/AuthService';
import AlertService from '../services/ToastService';

type Props = RootStackScreenProps<'PasswordRecoveryScreen'>;

const PasswordRecoveryScreen: React.FC<Props> = ({navigation, route}) => {
  const {email} = route.params ?? {email: ''};
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // error states
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [codeError, setCodeError] = useState('');

  const handleResetPassword = () => {
    let valid = true;

    // Recovery code validation
    if (!code) {
      setCodeError('Recovery code is required.');
      valid = false;
    } else if (!/^\d+$/.test(code)) {
      setCodeError('Code must be numeric.');
      valid = false;
    } else {
      setCodeError('');
    }

    // New password validation
    if (!newPassword) {
      setNewPasswordError('New password is required.');
      valid = false;
    } else if (newPassword.length < 6) {
      setNewPasswordError('Password must be at least 6 characters.');
      valid = false;
    } else {
      setNewPasswordError('');
    }

    // Confirm password validation
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password.');
      valid = false;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      valid = false;
    } else {
      setConfirmPasswordError('');
    }

    if (!valid) return;

    // All good → continue
    console.log({email, code, newPassword, confirmPassword});
    forgotPasswordConfirm(email, code, newPassword)
      .then(() => {
        console.log('Password reset successful for:', email);
        AlertService.toastPrompt(
          'Success',
          'Your password has been reset. Please log in with your new password.',
          'success'
        );
        navigation.navigate(SCREEN_NAMES.LOGIN);
      })
      .catch(err => {
        console.error('Error resetting password:', err);
        Alert.alert(
          'Error',
          'Failed to reset password. Please check the code and try again.',
        );
      });
    // Alert.alert('Success', 'Password reset successfully!');
    // TODO: Integrate with Amplify / API
  };

  const handleCancel = () => {
    navigation.navigate(SCREEN_NAMES.LOGIN);
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

            {/* Info */}
            <Text style={styles.infoText}>
              Email sent! Enter the code to reset your password.
            </Text>

            {/* Code */}
            <CustomTextInput
              label="Recovery Code"
              mode="outlined"
              value={code}
              onChangeText={text => {
                setCode(text);
                setCodeError('');
              }}
              keyboardType="number-pad"
              errorMessage={codeError}
            />

            {/* New Password */}
            <CustomTextInput
              label="New Password"
              mode="outlined"
              value={newPassword}
              onChangeText={text => {
                setNewPassword(text);
                setNewPasswordError('');
              }}
              secureTextEntry
              errorMessage={newPasswordError}
            />

            {/* Confirm Password */}
            <CustomTextInput
              label="Confirm New Password"
              mode="outlined"
              value={confirmPassword}
              onChangeText={text => {
                setConfirmPassword(text);
                setConfirmPasswordError('');
              }}
              secureTextEntry
              errorMessage={confirmPasswordError}
            />

            {/* Reset Password Button */}
            <CustomButton
              onPress={handleResetPassword}
              title="Reset Password"
              textColor="#000000"
              backgroundColor="#64B5F6"
            />

            {/* Cancel */}
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.linkContainer}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PasswordRecoveryScreen;

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
  infoText: {
    fontSize: 15,
    fontFamily: Fonts.LIGHT,
    color: Colors.WHITE,
    marginBottom: 25,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: Fonts.LIGHT,
    color: '#64B5F6',
    textDecorationLine: 'underline',
    marginTop: 15,
    textAlign: 'center',
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
});
