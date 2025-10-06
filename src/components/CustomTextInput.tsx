import React, {useState} from 'react';
import {Text, View} from 'react-native';
import {TextInput, useTheme} from 'react-native-paper';
import Ionicons from '@react-native-vector-icons/ionicons';
import {CustomTheme} from '../utils/theme';

interface CustomTextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  icon?: React.ReactNode;
  mode?: 'flat' | 'outlined';
  errorMessage?: string;
}

const CustomTextInput: React.FC<CustomTextInputProps> = ({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  icon,
  mode,
  errorMessage,
}) => {
  const [hidePassword, setHidePassword] = useState(secureTextEntry);
  const {colors} = useTheme<CustomTheme>();
  return (
    <View style={{marginBottom: 15}}>
      <TextInput
        label={label}
        mode={mode}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={hidePassword}
        keyboardType={keyboardType}
        style={{backgroundColor: '#111'}}
        outlineStyle={{borderRadius: 8}}
        autoCapitalize="none"
        textColor={colors.text}
        autoComplete={secureTextEntry ? 'password' : 'email'}
        left={icon ? <TextInput.Icon icon={() => icon} /> : undefined}
        right={
          secureTextEntry ? (
            <TextInput.Icon
              icon={() => (
                <Ionicons
                  name={hidePassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.primary}
                />
              )}
              onPress={() => setHidePassword(!hidePassword)}
            />
          ) : undefined
        }
        theme={{
          colors: {primary: colors.primary, placeholder: '#aaa', text: '#fff'},
        }}
        error={!!errorMessage}
      />
      {errorMessage ? (
        <Text style={{color: 'red', fontSize: 12, marginTop: 4}}>
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
};

export default CustomTextInput;
