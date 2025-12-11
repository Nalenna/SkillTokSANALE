// src/screens/AddTweetScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { theme } from '../theme/theme';

const AddTweetScreen = ({ route, navigation }: { route: any, navigation: any }) => {
  const [tweetText, setTweetText] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = getAuth();
  const user = auth.currentUser;
  const { isReply, tweetId } = route.params || {};

  const handlePostTweet = async () => {
    if (!tweetText.trim()) {
      return Alert.alert('Empty Post', 'Please write something before posting.');
    }
    if (!user) {
      return Alert.alert('Error', 'You must be logged in to post.');
    }

    setLoading(true);
    try {
        const tweetData = {
            userId: user.uid,
            text: tweetText,
            likes: 0,
            replies: 0,
            createdAt: firestore.FieldValue.serverTimestamp(),
            userData: {
              displayName: user.displayName,
              username: user.email?.split('@')[0],
              profilePic: user.photoURL,
            }
          };

      if (isReply && tweetId) {
        const replyRef = firestore().collection('tweets').doc(tweetId).collection('replies').doc();
        await replyRef.set(tweetData);
        await firestore().collection('tweets').doc(tweetId).update({
          replies: firestore.FieldValue.increment(1),
        });
      } else {
        await firestore().collection('tweets').add(tweetData);
      }
      navigation.goBack();
    } catch (error) {
      console.error("Error posting tweet: ", error);
      Alert.alert('Error', 'Could not post your message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={theme.styles.button} onPress={handlePostTweet} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={theme.styles.buttonText}>{isReply ? 'Reply' : 'Post'}</Text>}
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          placeholder={isReply ? 'Post your reply' : "What's happening?"}
          value={tweetText}
          onChangeText={setTweetText}
          multiline
          autoFocus
          maxLength={280}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  cancelButton: {
    color: theme.colors.primary,
    fontSize: 16,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 18,
    textAlignVertical: 'top',
  },
});

export default AddTweetScreen;