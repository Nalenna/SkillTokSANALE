// src/navigation/MainStackNavigator.tsx

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MainTabNavigator from './MainTabNavigator';
import UserProfileScreen from '../screens/UserProfileScreen';
import AddCertificateScreen from '../screens/AddCertificateScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import EditInterestsScreen from '../screens/EditInterestsScreen';
import ChatScreen from '../screens/ChatScreen';
import SettingsScreen from '../screens/SettingsScreen';
import UserPostsScreen from '../screens/UserPostsScreen';
import AddTweetScreen from '../screens/AddTweetScreen';

const Stack = createStackNavigator();

const MainStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AddCertificate" component={AddCertificateScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="EditInterests" component={EditInterestsScreen} />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }: any) => ({
            title: route.params.otherUser.displayName
        })}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="UserPosts" component={UserPostsScreen} options={{ headerShown: false }}/>
      <Stack.Screen
        name="AddTweet"
        component={AddTweetScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};

export default MainStackNavigator;