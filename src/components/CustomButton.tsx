import React from 'react';
import {StyleSheet} from 'react-native';
import {Button} from 'react-native-paper';
import Fonts from '../assets/fonts';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  backgroundColor?: string;
  textColor?: string;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  backgroundColor = '#64B5F6', //rgb(66, 165, 245) rgb(66, 133, 244);
  textColor = '#000',
}) => {
  return (
    <Button
      onPress={onPress}
      mode="contained"
      style={[styles.button, {backgroundColor}]}
      textColor={textColor}
      labelStyle={{
        color: textColor,
        fontWeight: 'bold',
        fontFamily: Fonts.LIGHT,
      }}>
      {title}
    </Button>
  );
};

export default CustomButton;

const styles = StyleSheet.create({
  button: {
    paddingVertical: 5,
    borderRadius: 8,
    marginVertical: 15,
  },
});
