// src/screens/EditProfileScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth, updateProfile } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { theme } from '../theme/theme';
import Icon from 'react-native-vector-icons/Ionicons';

const EditProfileScreen = ({ navigation }: { navigation: any }) => {
  const auth = getAuth();
  const user = auth.currentUser;

  const [name, setName] = useState(user?.displayName || '');
  const [bio, setBio] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(user?.photoURL || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const userDocRef = firestore().collection('users').doc(user.uid);
      userDocRef.get().then(doc => {
        if (doc.exists) {
          const data = doc.data();
          setBio(data?.bio || '');
          setName(data?.displayName || '');
          setImageUri(data?.profilePic || null)
        }
      });
    }
  }, [user]);
  
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

  const handleUpdateProfile = async () => {
    if (!user) return Alert.alert('Error', 'You are not logged in.');
    
    setLoading(true);
    try {
      let photoURL = user.photoURL;

      if (imageUri && imageUri !== user.photoURL) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const storageRef = storage().ref(`profilePictures/${user.uid}`);
        await storageRef.put(blob);
        photoURL = await storageRef.getDownloadURL();
      }

      await updateProfile(user, { displayName: name, photoURL });
      
      const userDocRef = firestore().collection('users').doc(user.uid);
      await userDocRef.update({
        displayName: name,
        username: name.toLowerCase(),
        bio: bio,
        profilePic: photoURL,
      });

      Alert.alert('Success', 'Profile updated successfully.');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error updating profile', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={theme.styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1, width: '100%' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={theme.styles.title}>Edit Profile</Text>

          <TouchableOpacity onPress={handlePickImage} style={styles.imagePicker}>
              <Image source={{ uri: imageUri || 'https://via.placeholder.com/120' }} style={styles.profileImage} />
              <View style={styles.cameraIcon}>
                  <Icon name="camera" size={25} color="#fff"/>
              </View>
          </TouchableOpacity>

          <TextInput
            style={theme.styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[theme.styles.input, styles.bioInput]}
            placeholder="Your Bio"
            value={bio}
            onChangeText={setBio}
            multiline={true}
          />
          <TouchableOpacity style={theme.styles.button} onPress={handleUpdateProfile} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff"/> : <Text style={theme.styles.buttonText}>Save Changes</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    bioInput: {
        height: 100,
        textAlignVertical: 'top',
    },
    imagePicker: {
        marginBottom: 20,
        position: 'relative'
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: theme.colors.primary,
        padding: 8,
        borderRadius: 20,
    }
});

export default EditProfileScreen;