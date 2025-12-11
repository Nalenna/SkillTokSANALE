// src/screens/PostGridScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Text } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Video from 'react-native-video';
import storage from '@react-native-firebase/storage';
import { theme } from '../theme/theme';

const PostGridScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const { category } = route.params;
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const snapshot = await firestore()
          .collection('videos')
          .where('category', '==', category)
          .orderBy('createdAt', 'desc')
          .get();

        const postsData = await Promise.all(snapshot.docs.map(async (doc) => {
          const data = doc.data();
          let videoUrl = '';
          if (data.videoPath && data.videoPath.startsWith('gs://')) {
              videoUrl = await storage().refFromURL(data.videoPath).getDownloadURL();
          }
          return { id: doc.id, ...data, videoUrl };
        }));
        setPosts(postsData);
      } catch (error) {
        console.error(`Error fetching posts for category ${category}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [category]);

  if (loading) {
    return <View style={styles.container}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  }
  
  if (posts.length === 0) {
      return <View style={styles.container}><Text>No posts in this category yet.</Text></View>;
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      numColumns={3}
      renderItem={({ item, index }) => (
        <TouchableOpacity 
            onPress={() => navigation.navigate('UserPosts', { videos: posts, startIndex: index })}
        >
          <View style={styles.thumbnailContainer}>
            {item.videoUrl ? (
              <Video source={{ uri: item.videoUrl }} style={styles.thumbnail} paused={true} resizeMode="cover" />
            ) : <View style={styles.thumbnail} />}
          </View>
        </TouchableOpacity>
      )}
      style={styles.grid}
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  grid: { width: '100%', backgroundColor: '#fff' },
  thumbnailContainer: { flex: 1, aspectRatio: 1, padding: 2 },
  thumbnail: { width: '100%', height: '100%', backgroundColor: '#e0e0e0', borderRadius: 5 },
});

export default PostGridScreen;