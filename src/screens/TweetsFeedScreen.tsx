// src/screens/TweetsFeedScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import { useIsFocused } from '@react-navigation/native';
import { theme } from '../theme/theme';
import Icon from 'react-native-vector-icons/Ionicons';

// A smaller card just for displaying replies
const ReplyCard = ({ item }: { item: any }) => (
    <View style={styles.replyContainer}>
        <Image source={{ uri: item.userData.profilePic || 'https://via.placeholder.com/30' }} style={styles.replyAvatar} />
        <View style={styles.replyContent}>
            <View style={styles.tweetHeader}>
                <Text style={styles.replyDisplayName}>{item.userData.displayName}</Text>
                <Text style={styles.replyUsername}>@{item.userData.username}</Text>
            </View>
            <Text style={styles.replyText}>{item.text}</Text>
        </View>
    </View>
);


const TweetCard = ({ item, navigation }: { item: any, navigation: any }) => {
    const [showReplies, setShowReplies] = useState(false);
    const [replies, setReplies] = useState<any[]>([]);
    const [loadingReplies, setLoadingReplies] = useState(false);

    const fetchReplies = async () => {
        if (replies.length > 0) return; // Don't refetch
        setLoadingReplies(true);
        try {
            const repliesSnapshot = await firestore()
                .collection('tweets')
                .doc(item.id)
                .collection('replies')
                .orderBy('createdAt', 'asc')
                .get();

            const repliesData = repliesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setReplies(repliesData);
        } catch (error) {
            console.error("Error fetching replies: ", error);
        } finally {
            setLoadingReplies(false);
        }
    };

    const handleToggleReplies = () => {
        const newShowReplies = !showReplies;
        setShowReplies(newShowReplies);
        if (newShowReplies) {
            fetchReplies();
        }
    };

    return (
        <View>
            <View style={styles.tweetContainer}>
                <Image source={{ uri: item.userData.profilePic || 'https://via.placeholder.com/50' }} style={styles.avatar} />
                <View style={styles.tweetContent}>
                    <View style={styles.tweetHeader}>
                        <Text style={styles.displayName}>{item.userData.displayName}</Text>
                        <Text style={styles.username}>@{item.userData.username}</Text>
                    </View>
                    <Text style={styles.tweetText}>{item.text}</Text>
                    <View style={styles.tweetActions}>
                        <TouchableOpacity style={styles.actionButton} onPress={handleToggleReplies}>
                            <Icon name="chatbubble-outline" size={20} color="gray" />
                            <Text style={styles.actionText}>{item.replies || 0}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                            <Icon name="heart-outline" size={20} color="gray" />
                            <Text style={styles.actionText}>{item.likes || 0}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('AddTweet', { isReply: true, tweetId: item.id })}>
                            <Icon name="pencil-outline" size={20} color="gray" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                            <Icon name="share-social-outline" size={20} color="gray" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            {showReplies && (
                <View style={styles.repliesSection}>
                    {loadingReplies ? <ActivityIndicator color={theme.colors.primary} /> :
                        replies.map(reply => <ReplyCard key={reply.id} item={reply} />)
                    }
                </View>
            )}
        </View>
    );
};


const TweetsFeedScreen = ({ navigation }: { navigation: any }) => {
  const [tweets, setTweets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) return;

    const unsubscribe = firestore()
      .collection('tweets')
      .orderBy('createdAt', 'desc')
      .onSnapshot(querySnapshot => {
        const tweetsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTweets(tweetsData);
        setLoading(false);
      }, error => {
        console.error("Error fetching tweets: ", error);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [isFocused]);


  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Feed</Text>
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : (
        <FlatList
          data={tweets}
          renderItem={({ item }) => <TweetCard item={item} navigation={navigation} />}
          keyExtractor={item => item.id}
          ListEmptyComponent={<Text style={styles.emptyText}>No posts yet. Be the first!</Text>}
        />
      )}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddTweet')}>
        <Icon name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { ...theme.styles.title, paddingLeft: 15, paddingBottom: 10, textAlign: 'left'},
  emptyText: { textAlign: 'center', marginTop: 50, color: 'gray' },
  tweetContainer: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  tweetContent: { flex: 1 },
  tweetHeader: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' },
  displayName: { fontWeight: 'bold', fontSize: 16, color: '#000' },
  username: { color: 'gray', marginLeft: 5 },
  tweetText: { marginTop: 5, fontSize: 15, lineHeight: 22, color: '#333' },
  tweetActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingRight: 30 },
  actionButton: { flexDirection: 'row', alignItems: 'center' },
  actionText: { marginLeft: 5, color: 'gray' },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  // Reply styles
  repliesSection: {
    marginLeft: 60, // Indent replies
    paddingRight: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  replyContainer: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingLeft: 10,
  },
  replyAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  replyContent: {
    flex: 1,
  },
  replyDisplayName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#000',
  },
  replyUsername: {
    color: 'gray',
    marginLeft: 5,
    fontSize: 13,
  },
  replyText: {
    marginTop: 3,
    fontSize: 14,
    color: '#333',
  },
});

export default TweetsFeedScreen;