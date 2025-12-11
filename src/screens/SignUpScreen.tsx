// src/screens/SignUpScreen.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { theme } from '../theme/theme';
import Icon from 'react-native-vector-icons/Ionicons';

const SignUpScreen = ({ navigation }: { navigation: any }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.5 }, (response: ImagePickerResponse) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Error', 'Could not select image.');
      } else if (response.assets && response.assets.length > 0) {
        setImageUri(response.assets[0].uri || null);
      }
    });
  };

  const handleSignUp = async () => {
    if (!email || !password || !username) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    const auth = getAuth();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        let photoURL = `https://ui-avatars.com/api/?name=${username.replace(' ', '+')}&background=C734B4&color=fff&size=128`;

        if (imageUri) {
            const response = await fetch(imageUri);
            const blob = await response.blob();
            const storageRef = storage().ref(`profilePictures/${user.uid}`);
            await storageRef.put(blob);
            photoURL = await storageRef.getDownloadURL();
        }

        await updateProfile(user, {
            displayName: username,
            photoURL: photoURL
        });

        await firestore().collection('users').doc(user.uid).set({
          uid: user.uid,
          email: user.email,
          username: username.toLowerCase(),
          displayName: username,
          bio: '',
          profilePic: photoURL,
          followers: 0,
          following: 0,
          createdAt: firestore.FieldValue.serverTimestamp(),
          hasCompletedOnboarding: false,
        });
      }
    } catch (error: any) {
      let errorMessage = "An unknown error occurred.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'That email address is already in use!';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'That email address is invalid!';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      } else {
        errorMessage = error.message;
      }
      Alert.alert('Sign Up Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={theme.styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Text style={theme.styles.title}>Create an Account</Text>

            <TouchableOpacity onPress={handlePickImage} style={styles.imagePicker}>
                {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.profileImage} />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Icon name="camera-outline" size={40} color="#888" />
                        <Text style={styles.imagePlaceholderText}>Add Profile Photo</Text>
                    </View>
                )}
            </TouchableOpacity>

            <TextInput
                style={theme.styles.input}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
            />
            <TextInput
                style={theme.styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <TextInput
                style={theme.styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <TouchableOpacity style={theme.styles.button} onPress={handleSignUp} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={theme.styles.buttonText}>Sign Up</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                <Text style={theme.styles.link}>Already have an account? Sign In</Text>
            </TouchableOpacity>
        </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    imagePicker: {
        marginBottom: 20,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    imagePlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePlaceholderText: {
        color: '#888',
        marginTop: 5,
    },
});

export default SignUpScreen;