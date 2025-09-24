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
} from 'react-native';
import {Colors} from '../assets';
import CustomTextInput from '../components/CustomTextInput';
import CustomButton from '../components/CustomButton';
import Fonts from '../assets/fonts';
import LogoHeader from '../components/Logo';
import Ionicons from '@react-native-vector-icons/ionicons';

const PasswordRecoveryScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [emailError, setEmailError] = useState('');

  const handleResetPassword = () => {
    console.log({email, code, newPassword, confirmPassword});
    // TODO: Add reset password logic (Amplify / API)
  };

  const handleCancel = () => {
    console.log('Cancel pressed');
    // TODO: navigate back
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

            {/* Email */}

            {/* Code */}
            <CustomTextInput
              label="Recovery Code"
              mode="outlined"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
             
            />

            {/* New Password */}
            <CustomTextInput
              label="New Password"
              mode="outlined"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
             
            />

            {/* Confirm Password */}
            <CustomTextInput
              label="Confirm New Password"
              mode="outlined"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
             
            />

            {/* Reset Password Button */}
            <CustomButton
              onPress={handleResetPassword}
              title="Reset Password"
              textColor="#000000"
              backgroundColor="#64B5F6"
            />

            {/* Cancel */}
            <TouchableOpacity onPress={handleCancel} style={styles.linkContainer}>
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
