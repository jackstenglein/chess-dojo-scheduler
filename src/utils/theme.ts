import {MD3DarkTheme, MD3LightTheme, MD3Theme} from 'react-native-paper';

export type CustomTheme = MD3Theme & {
  colors: MD3Theme['colors'] & {
    text: string;
  };
};

export const LightTheme: CustomTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#FF9800',
    text: '#ffffff',

  },
};

export const DarkTheme: CustomTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#FF9800',
    text: '#ffffff',

  },
};
