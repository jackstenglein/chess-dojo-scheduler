import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';

export type RootStackParamList = {
  name: any;
  LoginScreen: undefined;
  SignUpScreen: undefined;
  HomeScreen: {email?: string | undefined; password?: string | undefined};
  PasswordResetScreen: undefined;
  PasswordRecoveryScreen: {email: string};
  ConfirmCodeScreen: {username: string};
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type RootRouteProp<T extends keyof RootStackParamList> = RouteProp<
  RootStackParamList,
  T
>;
