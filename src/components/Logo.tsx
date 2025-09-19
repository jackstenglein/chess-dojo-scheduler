import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {Colors, Logo} from '../assets';
import Fonts from '../assets/fonts';
const LogoHeader: React.FC = ({}) => {
  return (
    <View style={styles.logoContainer}>
      <Logo width={80} height={80} fill={Colors.WHITE} />
      <Text style={styles.logoText}>ChessDojo</Text>
    </View>
  );
};

export default LogoHeader;

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 24,
    color: '#fff',
    marginTop: 10,
    fontWeight: 'bold',
    fontFamily: Fonts.LIGHT,
  },
});
