// src/screens/SettingsScreen.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { theme } from '../theme/theme';

const SettingsScreen = ({ navigation }: { navigation: any }) => {
  const auth = getAuth();
  const user = auth.currentUser;

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={theme.styles.container}>
      <Text style={theme.styles.title}>Settings</Text>
      {user && <Text style={styles.userInfo}>Logged in as: {user.email}</Text>}
      
      <TouchableOpacity style={theme.styles.button} onPress={() => navigation.navigate('EditInterests')}>
        <Text style={theme.styles.buttonText}>Edit Interests</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[theme.styles.button, styles.signOutButton]} onPress={handleSignOut}>
        <Text style={theme.styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  userInfo: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 20,
  },
  signOutButton: {
      backgroundColor: '#888', // A different color for sign out
      marginTop: 20,
  }
});

export default SettingsScreen;