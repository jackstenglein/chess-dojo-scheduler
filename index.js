
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {Amplify} from 'aws-amplify';
import {awsConfig} from './src/utils/baseUrl';
import 'react-native-quick-crypto';
global.crypto = require('react-native-quick-crypto');

Amplify.configure(awsConfig);

AppRegistry.registerComponent(appName, () => App);
