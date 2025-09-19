import React, { useEffect } from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '../screens/Home';
import LoginScreen from '../screens/Login';
import SignUpScreen from '../screens/SignUp';
import {RootStackParamList} from '../utils/types/navigation';
import PasswordResetScreen from '../screens/PasswordReset';
import { SCREEN_NAMES } from '../utils/types/screensName';
import RNBootSplash from "react-native-bootsplash";

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigation = () => {

useEffect(()=>{
   setTimeout(() => {
        RNBootSplash.hide({fade: true});
      }, 1000);
},[])


  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name={SCREEN_NAMES.LOGIN}  component={LoginScreen} />
        <Stack.Screen name={SCREEN_NAMES.SIGNUP} component={SignUpScreen} />
        <Stack.Screen name={SCREEN_NAMES.HOME} component={HomeScreen} />
        <Stack.Screen
          name={SCREEN_NAMES.PASSWORD_RESET}
          component={PasswordResetScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigation;
