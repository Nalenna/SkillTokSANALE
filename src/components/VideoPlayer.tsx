// src/components/VideoPlayer.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  ActivityIndicator,
  Image,
  TouchableWithoutFeedback,
  Share,
  Alert,
} from 'react-native';
import Video, { OnLoadData, OnProgressData } from 'react-native-video';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import { useIsFocused } from '@react-navigation/native';
import CommentModal from './CommentModal';
import { theme } from '../theme/theme';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const VideoPlayer = ({ item, isActive, navigation, shouldLoad }: { item: any; isActive: boolean; navigation: any; shouldLoad: boolean; }) => {
  const [paused, setPaused] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes || 0);
  const [commentCount, setCommentCount] = useState(item.comments || 0);
  const [isCommentModalVisible, setCommentModalVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoAspectRatio, setVideoAspectRatio] = useState(9 / 16);
  const [downloadURL, setDownloadURL] = useState<string | null>(null);

  const videoRef = useRef<Video>(null);
  const lastTap = useRef<number | null>(null);
  const auth = getAuth();
  const currentUserId = auth.currentUser?.uid;
  const isFocused = useIsFocused();
  
  useEffect(() => {
    if (!shouldLoad) {
      setDownloadURL(null); 
      return;
    }

    if (item.videoPath && item.videoPath.startsWith('gs://')) {
        storage().refFromURL(item.videoPath).getDownloadURL()
          .then(setDownloadURL)
          .catch(error => console.error("Error getting download URL: ", error));
    }

    firestore().collection('users').doc(item.userId).get()
      .then(userDoc => {
        if (userDoc.exists) setUserData(userDoc.data());
      });

    if (currentUserId) {
      firestore().collection('videos').doc(item.id).collection('likes').doc(currentUserId).get()
        .then(likeDoc => setIsLiked(likeDoc.exists));
    }
  }, [shouldLoad, item, currentUserId]);


  useEffect(() => {
    setPaused(!isFocused || !isActive);
  }, [isFocused, isActive]);
  
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

  const handleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (lastTap.current && (now - lastTap.current) < DOUBLE_PRESS_DELAY) {
        if (!isLiked) handleLike();
    } else {
        setPaused(p => !p);
    }
    lastTap.current = now;
  }, [isLiked, handleLike]);
  
  const navigateToProfile = () => {
    if (item.userId === currentUserId) {
      navigation.navigate('Profile');
    } else {
      navigation.navigate('UserProfile', { userId: item.userId });
    }
  };

  const onProgressCallback = (data: OnProgressData) => {
    if (!isBuffering && duration > 0) {
      setProgress(data.currentTime / duration);
    }
  };

  const onLoadCallback = (data: OnLoadData) => {
    setDuration(data.duration);
    if (data.naturalSize.width && data.naturalSize.height) {
        setVideoAspectRatio(data.naturalSize.width / data.naturalSize.height);
    }
    setIsBuffering(false);
  };

  const onSeek = (value: number) => {
    videoRef.current?.seek(value * duration);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this video from ${userData?.displayName || 'a user'} on our app!`,
        url: downloadURL || undefined,
      });
    } catch (error) {
      Alert.alert("Error", "Could not share at this time.");
    }
  };
  
  if (!shouldLoad) {
    return <View style={styles.container} />;
  }

  const screenAspectRatio = SCREEN_WIDTH / SCREEN_HEIGHT;
  const videoStyle = videoAspectRatio > screenAspectRatio 
    ? { width: '100%', height: undefined, aspectRatio: videoAspectRatio } 
    : { height: '100%', width: undefined, aspectRatio: videoAspectRatio, alignSelf: 'center' };

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View style={styles.container}>
        {downloadURL ? (
          <Video
            ref={videoRef}
            source={{ uri: downloadURL }}
            style={[styles.video, videoStyle]}
            resizeMode="contain"
            paused={paused}
            repeat={true}
            onLoad={onLoadCallback}
            onLoadStart={() => setIsBuffering(true)}
            onProgress={onProgressCallback}
            onBuffer={({ isBuffering }) => setIsBuffering(isBuffering)}
            onError={(e) => console.log('Video Player Error:', e)}
            bufferConfig={{
              minBufferMs: 2000,
              maxBufferMs: 20000,
              bufferForPlaybackMs: 1000,
              bufferForPlaybackAfterRebufferMs: 2000,
            }}
          />
        ) : (
          <ActivityIndicator style={StyleSheet.absoluteFill} size="large" color="#fff" />
        )}
        
        {isBuffering && <ActivityIndicator style={styles.loader} size="large" color="#fff" />}
        {paused && !isBuffering && (
          <View style={styles.playButtonContainer} pointerEvents="none">
            <Icon name="play" size={80} color="rgba(255, 255, 255, 0.7)" />
          </View>
        )}
        <View style={styles.overlay}>
          <View style={styles.bottomSection}>
            <TouchableOpacity onPress={navigateToProfile}>
              <Text style={styles.username}>@{userData?.username || '...'}</Text>
            </TouchableOpacity>
            <Text style={styles.caption}>{item.caption}</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={progress}
              onSlidingComplete={onSeek}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor="rgba(255, 255, 255, 0.5)"
              thumbTintColor={theme.colors.primary}
            />
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
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
    container: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
    video: { position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 },
    loader: { position: 'absolute' },
    playButtonContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
    overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, justifyContent: 'flex-end' },
    bottomSection: { padding: 15, paddingBottom: 60, zIndex: 1, justifyContent: 'flex-end', flex: 1 },
    username: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    caption: { color: 'white', fontSize: 15, marginTop: 5, marginBottom: 15 },
    sidebar: { position: 'absolute', right: 10, bottom: 100, alignItems: 'center', zIndex: 2 },
    profilePic: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: 'white', marginBottom: 20 },
    sidebarButton: { alignItems: 'center', marginBottom: 25 },
    sidebarText: { color: 'white', fontSize: 14, marginTop: 5 },
    slider: { width: SCREEN_WIDTH - 30, height: 40, alignSelf: 'center' },
});

export default VideoPlayer;