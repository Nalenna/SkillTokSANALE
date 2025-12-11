// src/navigation/AppNavigator.tsx

import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './AuthNavigator';
import MainStackNavigator from './MainStackNavigator';
import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';

const AppNavigator = () => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const subscriber = onAuthStateChanged(auth, async (userState) => {
      setUser(userState);

      if (userState) {
        // Request notification permission
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          // Get the FCM token and save it to the user's document
          const fcmToken = await messaging().getToken();
          if (fcmToken) {
            await firestore().collection('users').doc(userState.uid).update({
              fcmToken: fcmToken,
            });
          }
        }
      }

      if (loading) {
        setLoading(false);
      }
    });

    return subscriber; // Unsubscribe on unmount
  }, []);

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      {user ? <MainStackNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator;