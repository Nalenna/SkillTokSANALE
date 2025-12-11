// src/screens/AddCertificateScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconFallback as Icon } from '../utils/IconHelper';
import { launchImageLibrary } from 'react-native-image-picker';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

const AddCertificateScreen = ({ navigation }: { navigation: any }) => {
  const [title, setTitle] = useState('');
  const [issuer, setIssuer] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const currentUser = auth().currentUser;

  const handlePickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.5 }, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Error', 'Could not select image.');
      } else if (response.assets && response.assets.length > 0) {
        setImageUri(response.assets[0].uri || null);
      }
    });
  };

  const handleAddCertificate = async () => {
    if (!title || !issuer || !imageUri) {
      return Alert.alert('Error', 'Please fill in all fields and select an image.');
    }
    if (!currentUser) return;

    setLoading(true);
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const storageRef = storage().ref(`certificates/${currentUser.uid}/${Date.now()}`);
      await storageRef.put(blob);
      const imageUrl = await storageRef.getDownloadURL();

      await firestore().collection('users').doc(currentUser.uid).collection('certificates').add({
        title,
        issuer,
        imageUrl,
        verificationUrl,
        issuedAt: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert('Success', 'Certificate added!');
      navigation.goBack();
    } catch (error) {
      console.error("Error adding certificate: ", error);
      Alert.alert('Error', 'Failed to add certificate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Add Certificate</Text>

          <TouchableOpacity onPress={handlePickImage} style={styles.imagePicker}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.certImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Icon name="cloud-upload-outline" size={40} color="#888" />
                <Text style={styles.imagePlaceholderText}>Upload Certificate Image</Text>
              </View>
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Certificate Title (e.g., Certified Developer)"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="Issuing Organization (e.g., Google)"
            value={issuer}
            onChangeText={setIssuer}
          />
          <TextInput
            style={styles.input}
            placeholder="Verification URL (optional)"
            value={verificationUrl}
            onChangeText={setVerificationUrl}
          />

          <TouchableOpacity style={styles.button} onPress={handleAddCertificate} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Add Certificate</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F2F5' },
    scrollContainer: { padding: 20, flexGrow: 1, justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', color: 'black', textAlign: 'center', marginBottom: 30 },
    input: { backgroundColor: '#fff', color: 'black', padding: 15, borderRadius: 5, marginBottom: 20, borderWidth: 1, borderColor: '#ddd' },
    imagePicker: { alignItems: 'center', marginBottom: 30 },
    certImage: { width: '100%', height: 200, borderRadius: 10, resizeMode: 'contain' },
    imagePlaceholder: { width: '100%', height: 200, borderRadius: 10, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
    imagePlaceholderText: { color: '#888', marginTop: 10 },
    button: { backgroundColor: '#C734B4', paddingVertical: 15, borderRadius: 8, alignItems: 'center' },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
  
export default AddCertificateScreen;