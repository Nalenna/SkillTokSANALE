// src/screens/SignInScreen.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth, signInWithEmailAndPassword } from '@react-native-firebase/auth';
import { theme } from '../theme/theme';

const SignInScreen = ({ navigation }: { navigation: any }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    const auth = getAuth();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // The onAuthStateChanged listener in AppNavigator will handle navigation
    } catch (error: any) {
      let errorMessage = "An unknown error occurred.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Please enter a valid email address.';
      } else {
          errorMessage = error.message;
      }
      Alert.alert('Sign In Failed', errorMessage);
    } finally {
        setLoading(false);
    }
  };

  return (
    <SafeAreaView style={theme.styles.container}>
      <Text style={theme.styles.title}>Welcome Back!</Text>
      <TextInput
        style={theme.styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={theme.styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={theme.styles.button} onPress={handleSignIn} disabled={loading}>
        {loading ? (
            <ActivityIndicator color="#fff" />
        ) : (
            <Text style={theme.styles.buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={theme.styles.link}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default SignInScreen;