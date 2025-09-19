import React from 'react';
import {TouchableOpacity, Text, StyleSheet, View} from 'react-native';
import {Colors} from '../assets';

interface SocialButtonProps {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
  backgroundColor?: string;
}

const SocialButton: React.FC<SocialButtonProps> = ({
  icon,
  title,
  onPress,
  backgroundColor = 'rgb(66, 133, 244)', // // '#4285F4',rgb(66, 133, 244);
}) => {
  return (
    <TouchableOpacity
      style={[styles.socialButton, {backgroundColor}]}
      onPress={onPress}>
      {/* Left icon container */}
      <View style={styles.iconContainer}>{icon}</View>

      {/* Centered text */}
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

export default SocialButton;

const styles = StyleSheet.create({
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgb(66, 133, 244)',
    height: 48,
    width: 240,
    alignSelf: 'center',
    marginTop: 20,
    // subtle shadow
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: {width: 0, height: 1},
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 40,
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: '#dadce0',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    backgroundColor: '#fff',
  },
  text: {
    flex: 1,
    textAlign: 'center',
    color: Colors.WHITE,
    fontSize: 14,
    fontWeight: '500',
    
  },
});
