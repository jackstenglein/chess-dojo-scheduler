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
import {
  confirmUserRegistration,
  forgotPasswordConfirm,
} from '../services/AuthService';
import AlertService from '../services/ToastService';

type Props = RootStackScreenProps<'ConfirmCodeScreen'>;

const ConfirmCodeScreen: React.FC<Props> = ({navigation, route}) => {
  const {username} = route.params ?? {username: ''};
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [codeError, setCodeError] = useState('');

  const handleResetPassword = () => {
    let valid = true;

    if (!code) {
      setCodeError('Recovery code is required.');
      valid = false;
    } else if (!/^\d+$/.test(code)) {
      setCodeError('Code must be numeric.');
      valid = false;
    } else {
      setCodeError('');
    }

    if (!valid) {
      AlertService.toastPrompt('Please Enter Code code', '', 'error');
      return;
    }

    confirmUserRegistration(username, code)
      .then(() => {
        AlertService.toastPrompt(
          'Success:Your Account has been Created.',
          '',
          'success',
        );
        navigation.navigate(SCREEN_NAMES.LOGIN);
      })
      .catch(err => {
        AlertService.toastPrompt(
          'Error:Failed to Create Account.',
          '',
          'error',
        );
      });
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
            <LogoHeader />

            <Text style={styles.infoText}>
              Email sent! Enter the code to Activate Account.
            </Text>

           <CustomTextInput
              label="Confirmation Code"
              mode="outlined"
              value={code}
              onChangeText={text => {
                setCode(text);
                setCodeError('');
              }}
              keyboardType="number-pad"
              errorMessage={codeError}
            />

            <CustomButton
              onPress={handleResetPassword}
              title="Continue"
              textColor="#000000"
              backgroundColor="#64B5F6"
            />

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

export default ConfirmCodeScreen;

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
