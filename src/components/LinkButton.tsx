import React from 'react';
import {Text, TouchableOpacity, StyleSheet} from 'react-native';

interface LinkButtonProps {
  title: string;
  onPress: () => void;
}

const LinkButton: React.FC<LinkButtonProps> = ({title, onPress}) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text style={styles.linkText}>{title}</Text>
    </TouchableOpacity>
  );
};

export default LinkButton;

const styles = StyleSheet.create({
  linkText: {
    color: '#64B5F6',
    fontSize: 14,
  },
});
