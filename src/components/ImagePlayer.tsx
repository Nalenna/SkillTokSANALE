// src/components/ImagePlayer.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Image,
  Share,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import CommentModal from './CommentModal';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const ImagePlayer = ({ item, isActive, navigation }: { item: any; isActive: boolean; navigation: any; }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes || 0);
  const [commentCount, setCommentCount] = useState(item.comments || 0);
  const [isCommentModalVisible, setCommentModalVisible] = useState(false);
  
  const auth = getAuth();
  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    const fetchImageData = async () => {
      if (!isActive) return;
      try {
        if (item.videoPath && item.videoPath.startsWith('gs://')) {
          const url = await storage().refFromURL(item.videoPath).getDownloadURL();
          setImageUrl(url);
        }
        
        const userDoc = await firestore().collection('users').doc(item.userId).get();
        if (userDoc.exists) setUserData(userDoc.data());

        if (currentUserId) {
          const likeDoc = await firestore().collection('videos').doc(item.id).collection('likes').doc(currentUserId).get();
          setIsLiked(likeDoc.exists);
        }
      } catch (error) {
        console.error(`Error fetching data for image ${item.id}:`, error);
      }
    };
    fetchImageData();
  }, [isActive, item, currentUserId]);

  const handleLike = useCallback(async () => {
    if (!currentUserId) return;
    const likeRef = firestore().collection('videos').doc(item.id).collection('likes').doc(currentUserId);
    const videoRef = firestore().collection('videos').doc(item.id);
    
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount(prev => prev + (newIsLiked ? 1 : -1));

    try {
      if (newIsLiked) {
        await likeRef.set({ likedAt: firestore.FieldValue.serverTimestamp() });
        await videoRef.update({ likes: firestore.FieldValue.increment(1) });
      } else {
        await likeRef.delete();
        await videoRef.update({ likes: firestore.FieldValue.increment(-1) });
      }
    } catch (error) {
      console.error("Error updating like status:", error);
      setIsLiked(!newIsLiked);
      setLikeCount(prev => prev - (newIsLiked ? 1 : -1));
    }
  }, [isLiked, currentUserId, item.id]);

  const navigateToProfile = () => {
    if (item.userId === currentUserId) {
      navigation.navigate('Profile');
    } else {
      navigation.navigate('UserProfile', { userId: item.userId });
    }
  };

  const handleShare = async () => {
      try {
        await Share.share({
            message: `Check out this post from ${userData?.displayName || 'a user'} on our app!`,
            url: imageUrl || undefined,
        });
      } catch (error) {
        Alert.alert("Error", "Could not share at this time.");
      }
  };

  if (!isActive || !imageUrl) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />

      <View style={styles.overlay}>
        <View style={styles.bottomSection}>
          <TouchableOpacity onPress={navigateToProfile}>
            <Text style={styles.username}>@{userData?.username || '...'}</Text>
          </TouchableOpacity>
          <Text style={styles.caption}>{item.caption}</Text>
        </View>
      </View>

      <View style={styles.sidebar}>
        <TouchableOpacity onPress={navigateToProfile}>
          <Image source={{ uri: userData?.profilePic || 'https://via.placeholder.com/50' }} style={styles.profilePic} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.sidebarButton} onPress={handleLike}>
          <Icon name={isLiked ? "heart" : "heart-outline"} size={35} color={isLiked ? "#FF007F" : "white"} />
          <Text style={styles.sidebarText}>{likeCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sidebarButton} onPress={() => setCommentModalVisible(true)}>
          <Icon name="chatbubbles-outline" size={35} color="white" />
          <Text style={styles.sidebarText}>{commentCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sidebarButton} onPress={handleShare}>
          <Icon name="share-social-outline" size={35} color="white" />
          <Text style={styles.sidebarText}>Share</Text>
        </TouchableOpacity>
      </View>

      <CommentModal 
        isVisible={isCommentModalVisible} 
        onClose={() => setCommentModalVisible(false)} 
        videoId={item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
    container: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
    image: { position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 },
    overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, justifyContent: 'flex-end' },
    bottomSection: { padding: 15, paddingBottom: 60, zIndex: 1, justifyContent: 'flex-end', flex: 1 },
    username: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    caption: { color: 'white', fontSize: 15, marginTop: 5, marginBottom: 15 },
    sidebar: { position: 'absolute', right: 10, bottom: 100, alignItems: 'center', zIndex: 2 },
    profilePic: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: 'white', marginBottom: 20 },
    sidebarButton: { alignItems: 'center', marginBottom: 25 },
    sidebarText: { color: 'white', fontSize: 14, marginTop: 5 },
});

export default ImagePlayer;