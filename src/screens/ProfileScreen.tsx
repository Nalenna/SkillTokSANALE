// src/screens/ProfileScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { useIsFocused } from '@react-navigation/native';
import Video from 'react-native-video';
import { theme } from '../theme/theme';

const ProfileScreen = ({ navigation }: { navigation: any }) => {
  const [user, setUser] = useState<any>(null);
  const [userVideos, setUserVideos] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const isFocused = useIsFocused();

  const fetchProfileData = useCallback(async () => {
    if (!currentUser) return;
    try {
        const [userDocResult, videoSnapshotResult, certSnapshotResult] = await Promise.allSettled([
            firestore().collection('users').doc(currentUser.uid).get(),
            firestore().collection('videos').where('userId', '==', currentUser.uid).orderBy('createdAt', 'desc').get(),
            firestore().collection('users').doc(currentUser.uid).collection('certificates').orderBy('issuedAt', 'desc').get()
        ]);

        if (userDocResult.status === 'fulfilled' && userDocResult.value.exists) {
            setUser({ id: userDocResult.value.id, ...userDocResult.value.data() });
        }

        if (videoSnapshotResult.status === 'fulfilled') {
            const videosData = await Promise.all(videoSnapshotResult.value.docs.map(async (doc) => {
                const data = doc.data();
                let videoUrl = '';
                if (data.videoPath && data.videoPath.startsWith('gs://')) {
                    videoUrl = await storage().refFromURL(data.videoPath).getDownloadURL();
                }
                return { id: doc.id, ...data, videoUrl };
            }));
            setUserVideos(videosData);
        }

        if (certSnapshotResult.status === 'fulfilled') {
            setCertificates(certSnapshotResult.value.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }

    } catch (error) {
        console.error("Error fetching profile data: ", error);
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isFocused && currentUser) {
      fetchProfileData();
    }
  }, [fetchProfileData, isFocused, currentUser]);
  
  const onRefresh = () => {
      setRefreshing(true);
      fetchProfileData();
  };

  const handleDeleteVideo = (videoId: string, videoPath: string) => {
    Alert.alert(
        "Delete Video", "Are you sure you want to delete this video?",
        [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Delete", 
                style: "destructive", 
                onPress: async () => {
                    try {
                        await firestore().collection('videos').doc(videoId).delete();
                        if (videoPath && videoPath.startsWith('gs://')) {
                            await storage().refFromURL(videoPath).delete();
                        }
                        Alert.alert("Success", "Video deleted.");
                        fetchProfileData();
                    } catch (error) {
                        console.error("Error deleting video:", error);
                        Alert.alert("Error", "Could not delete the video.");
                    }
                }
            }
        ]
    );
  };

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setModalVisible(true);
  };

  const totalLikes = userVideos.reduce((sum, video) => sum + (video.likes || 0), 0);

  if (loading || !user) {
    return <SafeAreaView style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.colors.primary} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
          <Image source={{ uri: selectedImage }} style={styles.modalImage} resizeMode="contain" />
        </View>
      </Modal>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.settingsButton}>
            <Text style={styles.settingsButtonText}>Settings</Text>
        </TouchableOpacity>
        <View style={styles.header}>
          <Image source={{ uri: user.profilePic || 'https://via.placeholder.com/120' }} style={styles.profileImage} />
          <Text style={styles.username}>@{user.username}</Text>
          <Text style={styles.bio}>{user.bio || 'No bio yet.'}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.stat}><Text style={styles.statNumber}>{user.following || 0}</Text><Text style={styles.statLabel}>Following</Text></View>
          <View style={styles.stat}><Text style={styles.statNumber}>{user.followers || 0}</Text><Text style={styles.statLabel}>Followers</Text></View>
          <View style={styles.stat}><Text style={styles.statNumber}>{totalLikes}</Text><Text style={styles.statLabel}>Likes</Text></View>
        </View>

        <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('EditProfile')}>
                <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('AddCertificate')}>
                 <Text style={styles.buttonText}>Add Certificate</Text>
            </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>My Certificates</Text>
        {certificates.length > 0 ? (
          certificates.map(cert => (
            <View key={cert.id} style={styles.certCard}>
              <TouchableOpacity onPress={() => openImageModal(cert.imageUrl)}>
                <Image source={{ uri: cert.imageUrl }} style={styles.certImage} />
              </TouchableOpacity>
              <Text style={styles.certTitle}>{cert.title}</Text>
              <Text style={styles.certIssuer}>{cert.issuer}</Text>
              {cert.verificationUrl && (
                <TouchableOpacity onPress={() => Linking.openURL(cert.verificationUrl)}>
                  <Text style={styles.verifyButton}>Verify</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.noItemsText}>You have not added any certificates.</Text>
        )}

        <Text style={styles.sectionTitle}>My Videos</Text>
        {userVideos.length > 0 ? (
            <FlatList
              data={userVideos}
              keyExtractor={(item) => item.id}
              numColumns={3}
              renderItem={({ item, index }) => (
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('UserPosts', { videos: userVideos, startIndex: index })}
                    onLongPress={() => handleDeleteVideo(item.id, item.videoPath)}
                  >
                      <View style={styles.thumbnailContainer}>
                          {item.videoUrl ? (
                              <Video source={{ uri: item.videoUrl }} style={styles.thumbnail} paused={true} resizeMode="cover" />
                          ) : <View style={styles.thumbnail}/>}
                      </View>
                  </TouchableOpacity>
              )}
              style={styles.grid}
              scrollEnabled={false}
            />
        ) : (
            <Text style={styles.noItemsText}>You haven't posted any videos yet.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F2F5' },
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  settingsButton: { position: 'absolute', top: 20, right: 20, zIndex: 1 },
  settingsButtonText: { color: theme.colors.primary, fontSize: 16 },
  header: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
  profileImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: theme.colors.primary },
  username: { color: 'black', fontSize: 20, fontWeight: 'bold', marginTop: 10 },
  bio: { color: 'gray', textAlign: 'center', marginTop: 10 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', paddingVertical: 20 },
  stat: { alignItems: 'center' },
  statNumber: { color: 'black', fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: 'gray', fontSize: 14 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-evenly', marginBottom: 20, paddingHorizontal: 20},
  button: { backgroundColor: theme.colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5, flex: 1, marginHorizontal: 5, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: 'black', marginLeft: 20, marginBottom: 10, marginTop: 10 },
  certCard: { backgroundColor: 'white', borderRadius: 10, marginHorizontal: 20, marginBottom: 15, padding: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41 },
  certImage: { width: '100%', height: 150, borderRadius: 5, resizeMode: 'contain', marginBottom: 10 },
  certTitle: { fontSize: 16, fontWeight: 'bold', color: 'black' },
  certIssuer: { fontSize: 14, color: 'gray' },
  verifyButton: { color: theme.colors.primary, marginTop: 10 },
  grid: { width: '100%', paddingHorizontal: 1 },
  thumbnailContainer: { flex: 1, aspectRatio: 1, padding: 2 },
  thumbnail: { width: '100%', height: '100%', backgroundColor: '#e0e0e0', borderRadius: 5 },
  noItemsText: { textAlign: 'center', marginVertical: 20, color: 'gray' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)', justifyContent: 'center', alignItems: 'center' },
  modalImage: { width: '90%', height: '80%' },
  modalCloseButton: { position: 'absolute', top: 50, right: 20, padding: 10, zIndex: 2 },
  modalCloseButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default ProfileScreen;