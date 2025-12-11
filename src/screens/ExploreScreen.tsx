// src/screens/ExploreScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
  Text,
  Alert,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import VideoPlayer from '../components/VideoPlayer';
import ImagePlayer from '../components/ImagePlayer';
import MotivationalMessage from '../components/MotivationalMessage';
import { useIsFocused } from '@react-navigation/native';
import { theme } from '../theme/theme';

const { height } = Dimensions.get('window');
const SCREEN_TIME_LIMIT_MINUTES = 30;

const ExploreScreen = ({ navigation }: { navigation: any }) => {
  const [forYouPosts, setForYouPosts] = useState<any[]>([]);
  const [followingPosts, setFollowingPosts] = useState<any[]>([]);
  const [feedType, setFeedType] = useState<'forYou' | 'following'>('forYou');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePostIndex, setActivePostIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();
  const [postsToLoad, setPostsToLoad] = useState(new Set());

  const fetchForYouPosts = useCallback(async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      setError("Please sign in to see posts.");
      setLoading(false);
      return;
    }

    try {
      const userDoc = await firestore().collection('users').doc(user.uid).get();
      const userData = userDoc.data();
      const interests = userData?.careerInterests;

      let query = firestore().collection('videos').orderBy('createdAt', 'desc');

      if (interests && interests.length > 0) {
        query = query.where('category', 'in', interests);
      }

      const snapshot = await query.limit(10).get();
      
      if (snapshot.empty && interests && interests.length > 0) {
        const allPostsSnapshot = await firestore().collection('videos').orderBy('createdAt', 'desc').limit(10).get();
        if (allPostsSnapshot.empty) {
          setError('No posts found. Be the first to upload!');
        } else {
          const fetchedPosts = allPostsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setForYouPosts(fetchedPosts);
          setError(null);
        }
      } else if (snapshot.empty) {
        setError('No posts match your interests yet. Explore or upload!');
      } else {
        const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setForYouPosts(fetchedPosts);
        setError(null);
      }
    } catch (err) {
      console.error("Failed to fetch For You posts:", err);
      setError('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchFollowingPosts = useCallback(async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const followingSnapshot = await firestore().collection('users').doc(user.uid).collection('following').get();
      const followingIds = followingSnapshot.docs.map(doc => doc.id);

      if (followingIds.length === 0) {
        setFollowingPosts([]);
        setError('You are not following anyone yet.');
        return;
      }

      const snapshot = await firestore().collection('videos').where('userId', 'in', followingIds).orderBy('createdAt', 'desc').limit(10).get();
      if (snapshot.empty) {
        setFollowingPosts([]);
        setError('The users you follow haven\'t posted yet.');
      } else {
        const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFollowingPosts(fetchedPosts);
        setError(null);
      }
    } catch (err) {
      console.error("Failed to fetch Following posts:", err);
      setError('Failed to load posts from users you follow.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      Alert.alert(
        "Time for a break?",
        `You've been exploring for ${SCREEN_TIME_LIMIT_MINUTES} minutes. Consider taking a short break!`
      );
    }, SCREEN_TIME_LIMIT_MINUTES * 60 * 1000);

    if (isFocused) {
        if (feedType === 'forYou') {
          fetchForYouPosts();
        } else {
          fetchFollowingPosts();
        }
    }
    return () => clearTimeout(timer);
  }, [feedType, fetchForYouPosts, fetchFollowingPosts, isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    setPostsToLoad(new Set());
    if (feedType === 'forYou') {
      fetchForYouPosts();
    } else {
      fetchFollowingPosts();
    }
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const newActiveIndex = viewableItems[0].index;
      setActivePostIndex(newActiveIndex);
      const posts = feedType === 'forYou' ? forYouPosts : followingPosts;
      const newPostsToLoad = new Set();
      for (let i = -1; i <= 1; i++) {
        const indexToLoad = newActiveIndex + i;
        if (indexToLoad >= 0 && indexToLoad < posts.length) {
          newPostsToLoad.add(posts[indexToLoad].id);
        }
      }
      setPostsToLoad(newPostsToLoad);
    }
  }, [feedType, forYouPosts, followingPosts]);

  const renderContent = () => {
    if (loading && !refreshing) {
      return <View style={styles.container}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
    }
    const postsToShow = feedType === 'forYou' ? forYouPosts : followingPosts;
    if (error && postsToShow.length === 0) {
      return (
        <ScrollView 
            contentContainerStyle={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary}/>}
        >
            <Text style={styles.errorText}>{error}</Text>
        </ScrollView>
      );
    }
    return (
      <FlatList
        data={postsToShow}
        renderItem={({ item, index }) => {
          const shouldLoad = postsToLoad.has(item.id);
          if (item.type === 'image') {
            return <ImagePlayer item={item} isActive={index === activePostIndex} navigation={navigation} />;
          }
          return <VideoPlayer item={item} isActive={index === activePostIndex} navigation={navigation} shouldLoad={shouldLoad} />;
        }}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        windowSize={3}
        maxToRenderPerBatch={3}
        initialNumToRender={1}
        removeClippedSubviews={true}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      />
    );
  };

  return (
    <View style={styles.postContainer}>
        <SafeAreaView style={styles.header}>
            <TouchableOpacity onPress={() => setFeedType('following')}>
              <Text style={[styles.headerText, feedType === 'following' && styles.activeHeaderText]}>Following</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFeedType('forYou')}>
              <Text style={[styles.headerText, feedType === 'forYou' && styles.activeHeaderText]}>For You</Text>
            </TouchableOpacity>
        </SafeAreaView>
        {renderContent()}
        <MotivationalMessage />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' },
  errorText: { color: 'white', fontSize: 16, textAlign: 'center', padding: 20 },
  postContainer: { flex: 1, backgroundColor: 'black' },
  header: {
    position: 'absolute',
    top: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  headerText: {
    color: 'gray',
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 15,
    paddingVertical: 10,
  },
  activeHeaderText: {
    color: 'white',
  },
});

export default ExploreScreen;