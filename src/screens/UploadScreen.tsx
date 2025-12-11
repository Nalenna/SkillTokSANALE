// src/screens/UploadScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { theme } from '../theme/theme';
import Video from 'react-native-video';
import { Picker } from '@react-native-picker/picker';

const POST_CATEGORIES = [
  "STEM", "Reading", "DIY & Home Improvement", "Tech & Programming", 
  "Construction & Trades", "Retail & Sales", "Media & Content Creation", 
  "Hospitality & Tourism", "Finance & Accounting", "Logistics & Transport", 
  "Law & Public Service", "Culinary Arts", "Agriculture & Environmental Work", 
  "Healthcare & Wellness"
];

const UploadScreen = ({ navigation }: { navigation: any }) => {
  const [media, setMedia] = useState<any>(null);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState(POST_CATEGORIES[0]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const selectMedia = () => {
    launchImageLibrary({ mediaType: 'mixed' }, (response: ImagePickerResponse) => {
      if (response.didCancel) return;
      if (response.errorMessage) return Alert.alert('Error', response.errorMessage);
      if (response.assets && response.assets.length > 0) {
        setMedia(response.assets[0]);
      }
    });
  };

  const uploadMedia = async () => {
    if (!media || !caption || !category) {
      Alert.alert('Incomplete', 'Please select a file and fill out all fields.');
      return;
    }
    setUploading(true);
    setProgress(0);
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      setUploading(false);
      return Alert.alert('Not Authenticated', 'You must be logged in to upload.');
    }

    const uri = media.uri;
    if (!uri) {
        Alert.alert('Error', 'Invalid media file selected.');
        setUploading(false);
        return;
    }

    const isVideo = media.type?.startsWith('video');
    const mediaTypeFolder = isVideo ? 'videos' : 'images';
    const filename = uri.substring(uri.lastIndexOf('/') + 1);
    const storagePath = `${mediaTypeFolder}/${user.uid}/${Date.now()}_${filename}`;
    const storageRef = storage().ref(storagePath);

    const task = storageRef.putFile(uri);

    task.on('state_changed', snapshot => {
        setProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
    });

    try {
      await task;
      const fullStoragePath = `gs://${storageRef.bucket}/${storageRef.fullPath}`;

      await firestore().collection('videos').add({
        userId: user.uid,
        videoPath: fullStoragePath,
        caption: caption,
        category: category,
        likes: 0,
        comments: 0,
        createdAt: firestore.FieldValue.serverTimestamp(),
        type: isVideo ? 'video' : 'image',
      });

      Alert.alert('Success!', 'Your post has been uploaded.');
      setMedia(null);
      setCaption('');
      setCategory(POST_CATEGORIES[0]);
      navigation.navigate('Profile');
    } catch (error) {
      console.error("Upload error: ", error);
      Alert.alert('Upload Failed', 'There was an error uploading your post.');
    } finally {
        setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={theme.styles.title}>Create a Post</Text>
            
            <TouchableOpacity style={styles.selectButton} onPress={selectMedia}>
                {media?.type?.startsWith('image') ? (
                    <Image source={{ uri: media.uri }} style={styles.mediaPreview} />
                ) : media?.type?.startsWith('video') ? (
                    <Video source={{ uri: media.uri }} style={styles.mediaPreview} resizeMode="cover" paused={true} />
                ) : (
                    <Text style={styles.selectButtonText}>Select Photo or Video</Text>
                )}
            </TouchableOpacity>
            
            <TextInput
                style={theme.styles.input}
                placeholder="Enter a caption..."
                value={caption}
                onChangeText={setCaption}
            />
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={category}
                style={styles.picker}
                onValueChange={(itemValue) => setCategory(itemValue)}
              >
                {POST_CATEGORIES.map(cat => <Picker.Item key={cat} label={cat} value={cat} />)}
              </Picker>
            </View>
            
            {uploading ? (
            <View>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.progressText}>{`Uploading... ${progress}%`}</Text>
            </View>
            ) : (
            <TouchableOpacity style={theme.styles.button} onPress={uploadMedia} disabled={!media}>
                <Text style={theme.styles.buttonText}>Post</Text>
            </TouchableOpacity>
            )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  selectButton: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
  },
  selectButtonText: { fontSize: 18, color: theme.colors.primary },
  mediaPreview: { width: '100%', height: '100%', borderRadius: 8 },
  progressText: { marginTop: 10, fontSize: 16, color: theme.colors.primary },
  pickerContainer: {
    width: '100%',
    height: 50,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    justifyContent: 'center',
  },
  picker: {
    height: '100%',
    width: '100%',
  }
});

export default UploadScreen;