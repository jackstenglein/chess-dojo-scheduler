import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '../screens/Home';
import LoginScreen from '../screens/Login';
import SignUpScreen from '../screens/SignUp';
import {RootStackParamList} from '../utils/types/navigation';
import PasswordResetScreen from '../screens/PasswordReset';
import {SCREEN_NAMES} from '../utils/types/screensName';
import RNBootSplash from 'react-native-bootsplash';
import {useDispatch, useSelector} from 'react-redux';
import {Button} from 'react-native';
import {signOutUser} from '../redux/thunk/authThunk';
import {AppDispatch} from '../redux/store';
import ResetPasswordScreen from '../screens/RecoveryCode';
import PasswordRecoveryScreen from '../screens/RecoveryCode';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigation = () => {
  const {user, token} = useSelector((state: any) => state.auth);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    setTimeout(() => {
      RNBootSplash.hide({fade: true});
    }, 1000);
  }, []);

  const handleLogout = () => {
    dispatch(signOutUser());
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        
        {token ? (
          // If logged in → show Home flow
          <>
            <Stack.Screen
              name={SCREEN_NAMES.HOME}
              component={HomeScreen}
              options={{
                headerShown: true,
                headerRight: () => (
                  <Button title="Logout" onPress={handleLogout} />
                ),
              }}
            />
          </>
        ) : (
          // If not logged in → show Auth flow
          <>
            <Stack.Screen name={SCREEN_NAMES.LOGIN} component={LoginScreen} />
            <Stack.Screen name={SCREEN_NAMES.SIGNUP} component={SignUpScreen} />
            <Stack.Screen
              name={SCREEN_NAMES.PASSWORD_RESET}
              component={PasswordResetScreen}
            />
             <Stack.Screen
              name={SCREEN_NAMES.RECOVERY_CODE}
              component={PasswordRecoveryScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigation;
