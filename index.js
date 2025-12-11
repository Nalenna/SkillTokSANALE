// index.js

import { AppRegistry } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator'; // Correctly point to your navigator
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => AppNavigator);