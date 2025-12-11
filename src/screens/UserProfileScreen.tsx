// src/screens/UserProfileScreen.tsx

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
  Alert,
  Modal,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import Video from 'react-native-video';
import { theme } from '../theme/theme';
import { useIsFocused } from '@react-navigation/native';

const UserProfileScreen = ({ route, navigation }: { route: any, navigation: any }) => {
  const { userId } = route.params;
  const [user, setUser] = useState<any>(null);
  const [userVideos, setUserVideos] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  // State for image modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  const auth = getAuth();
  const currentUser = auth.currentUser;
  const isFocused = useIsFocused();

  const fetchProfileData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Fetch all data in parallel for speed
      const userDocPromise = firestore().collection('users').doc(userId).get();
      const videoSnapshotPromise = firestore().collection('videos').where('userId', '==', userId).orderBy('createdAt', 'desc').get();
      const certSnapshotPromise = firestore().collection('users').doc(userId).collection('certificates').orderBy('issuedAt', 'desc').get();
      const viewsSnapshotPromise = firestore().collection('users').doc(userId).collection('profileViews').get();

      const [userDoc, videoSnapshot, certSnapshot, viewsSnapshot] = await Promise.all([
        userDocPromise,
        videoSnapshotPromise,
        certSnapshotPromise,
        viewsSnapshotPromise,
      ]);

      if (userDoc.exists) {
        setUser({ id: userDoc.id, ...userDoc.data(), followers: userDoc.data()?.followers || 0, following: userDoc.data()?.following || 0 });
      } else {
        Alert.alert("Error", "User profile not found.");
        navigation.goBack();
        return;
      }

      const videosData = await Promise.all(videoSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        let videoUrl = '';
        if (data.videoPath && data.videoPath.startsWith('gs://')) {
          videoUrl = await storage().refFromURL(data.videoPath).getDownloadURL();
        }
        return { id: doc.id, ...data, videoUrl };
      }));
      setUserVideos(videosData);

      setCertificates(certSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Add view count to user object to ensure it's displayed
      setUser(prev => ({ ...prev, viewCount: viewsSnapshot.size }));

      if (currentUser) {
        const followDoc = await firestore().collection('users').doc(currentUser.uid).collection('following').doc(userId).get();
        setIsFollowing(followDoc.exists);
      }
    } catch (error) {
      console.error("Error fetching profile data: ", error);
      Alert.alert("Error", "Could not load profile.");
    } finally {
      setLoading(false);
    }
  }, [userId, currentUser, navigation]);

  const recordProfileView = useCallback(async () => {
    if (currentUser && currentUser.uid !== userId) {
        const viewerRef = firestore().collection('users').doc(userId).collection('profileViews').doc(currentUser.uid);
        await viewerRef.set({ viewedAt: firestore.FieldValue.serverTimestamp() }, { merge: true });
    }
  }, [currentUser, userId]);

  useEffect(() => {
    if (isFocused) {
      fetchProfileData();
      recordProfileView();
    }
  }, [fetchProfileData, recordProfileView, isFocused]);

  const handleFollow = async () => {
    if (!currentUser) return;

    const currentUserRef = firestore().collection('users').doc(currentUser.uid);
    const targetUserRef = firestore().collection('users').doc(userId);

    const newIsFollowing = !isFollowing;
    setIsFollowing(newIsFollowing);
    setUser(prevUser => ({
        ...prevUser,
        followers: prevUser.followers + (newIsFollowing ? 1 : -1)
    }));

    const batch = firestore().batch();
    if (newIsFollowing) {
        batch.set(currentUserRef.collection('following').doc(userId), {});
        batch.update(currentUserRef, { following: firestore.FieldValue.increment(1) });
        batch.update(targetUserRef, { followers: firestore.FieldValue.increment(1) });
    } else {
        batch.delete(currentUserRef.collection('following').doc(userId));
        batch.update(currentUserRef, { following: firestore.FieldValue.increment(-1) });
        batch.update(targetUserRef, { followers: firestore.FieldValue.increment(-1) });
    }

    try {
        await batch.commit();
    } catch (error) {
        console.error("Failed to update follow status:", error);
        setIsFollowing(!newIsFollowing);
        setUser(prevUser => ({
            ...prevUser,
            followers: prevUser.followers - (newIsFollowing ? 1 : -1)
        }));
        Alert.alert("Error", "Could not update follow status.");
    }
  };

  const handleMessage = async () => {
    if (!currentUser || !user) return;
    const chatId = [currentUser.uid, userId].sort().join('_');
    const chatRef = firestore().collection('chats').doc(chatId);

    try {
        const chatDoc = await chatRef.get();
        if (!chatDoc.exists) {
            await chatRef.set({
                users: [currentUser.uid, userId],
                userData: [
                    { uid: currentUser.uid, displayName: currentUser.displayName, profilePic: currentUser.photoURL },
                    { uid: user.id, displayName: user.displayName, profilePic: user.profilePic }
                ],
                lastMessage: {
                    text: 'Chat started!',
                    createdAt: firestore.FieldValue.serverTimestamp()
                }
            });
        }
        navigation.navigate('Chat', { chatId: chatId, otherUser: { uid: user.id, displayName: user.displayName, profilePic: user.profilePic } });
    } catch(error) {
        console.error("Error creating or navigating to chat:", error);
        Alert.alert("Error", "Could not start a message with this user.");
    }
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
      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
          <Image source={{ uri: selectedImage }} style={styles.modalImage} resizeMode="contain" />
        </View>
      </Modal>

      <ScrollView>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
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
          <View style={styles.stat}><Text style={styles.statNumber}>{user.viewCount || 0}</Text><Text style={styles.statLabel}>Views</Text></View>
        </View>

        <View style={styles.buttonContainer}>
            {currentUser?.uid !== userId && (
              <TouchableOpacity style={[styles.button, isFollowing ? styles.followingButton : styles.followButton]} onPress={handleFollow}>
                <Text style={styles.buttonText}>{isFollowing ? 'Following' : 'Follow'}</Text>
              </TouchableOpacity>
            )}
            {currentUser?.uid !== userId && (
                <TouchableOpacity style={[styles.button, styles.messageButton]} onPress={handleMessage}>
                    <Text style={styles.buttonText}>Message</Text>
                </TouchableOpacity>
            )}
        </View>

        <Text style={styles.sectionTitle}>Certificates</Text>
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
          <Text style={styles.noItemsText}>This user has not added any certificates.</Text>
        )}

        <Text style={styles.sectionTitle}>Videos</Text>
        {userVideos.length > 0 ? (
            <FlatList
            data={userVideos}
            keyExtractor={(item) => item.id}
            numColumns={3}
            renderItem={({ item, index }) => (
                <TouchableOpacity onPress={() => navigation.navigate('UserPosts', { videos: userVideos, startIndex: index })}>
                  <View style={styles.thumbnailContainer}>
                      {item.videoUrl ? (
                           <Video source={{ uri: item.videoUrl }} style={styles.thumbnail} paused={true} resizeMode="cover" />
                      ) : (
                          <View style={styles.thumbnail}/>
                      )}
                  </View>
                </TouchableOpacity>
            )}
            style={styles.grid}
            scrollEnabled={false}
          />
        ) : (
             <Text style={styles.noItemsText}>This user has not posted any videos.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F2F5' },
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  backButton: { position: 'absolute', top: 20, left: 20, zIndex: 1 },
  backButtonText: { color: theme.colors.primary, fontSize: 16 },
  header: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
  profileImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: theme.colors.primary },
  username: { color: 'black', fontSize: 20, fontWeight: 'bold', marginTop: 10 },
  bio: { color: 'gray', textAlign: 'center', marginTop: 10 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', paddingVertical: 20 },
  stat: { alignItems: 'center' },
  statNumber: { color: 'black', fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: 'gray', fontSize: 14 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-evenly', width: '100%', paddingHorizontal: 20, marginBottom: 20, },
  button: { flex: 1, marginHorizontal: 5, paddingVertical: 10, borderRadius: 5, alignItems: 'center' },
  followButton: { backgroundColor: theme.colors.primary },
  followingButton: { backgroundColor: '#888' },
  messageButton: { backgroundColor: '#4CAF50' },
  buttonText: { color: 'white', fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: 'black', marginLeft: 20, marginBottom: 10, marginTop: 10 },
  certCard: { backgroundColor: 'white', borderRadius: 10, marginHorizontal: 20, marginBottom: 15, padding: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41 },
  certImage: { width: '100%', height: 150, borderRadius: 5, resizeMode: 'contain', marginBottom: 10 },
  certTitle: { fontSize: 16, fontWeight: 'bold' },
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

export default UserProfileScreen;