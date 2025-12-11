// src/components/CommentModal.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconFallback as Icon } from '../utils/IconHelper';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

interface CommentModalProps {
  isVisible: boolean;
  onClose: () => void;
  videoId: string;
}

const CommentModal = ({ isVisible, onClose, videoId }: CommentModalProps) => {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const currentUser = auth().currentUser;

  useEffect(() => {
    if (!isVisible) return;

    setLoading(true);
    const unsubscribe = firestore()
      .collection('videos')
      .doc(videoId)
      .collection('comments')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const fetchedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setComments(fetchedComments);
        setLoading(false);
      }, error => {
          console.error(error);
          setLoading(false);
      });

    return () => unsubscribe();
  }, [isVisible, videoId]);

  const handlePostComment = async () => {
    if (!newComment.trim() || !currentUser) return;

    try {
      const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
      const userData = userDoc.data();

      const commentData = {
        text: newComment,
        userId: currentUser.uid,
        username: userData?.username,
        profilePic: userData?.profilePic,
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      if (replyingTo) {
        await firestore().collection('videos').doc(videoId).collection('comments').doc(replyingTo).collection('replies').add(commentData);
      } else {
        await firestore().collection('videos').doc(videoId).collection('comments').add(commentData);
      }

      await firestore().collection('videos').doc(videoId).update({
        comments: firestore.FieldValue.increment(1),
      });

      setNewComment('');
      setReplyingTo(null);
    } catch (error) {
      console.error("Error posting comment: ", error);
    }
  };

  const renderComment = ({ item }: { item: any }) => (
    <View style={styles.commentContainer}>
      <Image source={{ uri: item.profilePic }} style={styles.commentAvatar} />
      <View style={styles.commentTextContainer}>
        <Text style={styles.commentUsername}>{item.username}</Text>
        <Text style={styles.commentText}>{item.text}</Text>
        <TouchableOpacity onPress={() => setReplyingTo(item.id)}>
          <Text style={styles.replyButton}>Reply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal animationType="slide" transparent={false} visible={isVisible} onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Comments</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={30} color="#333" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator style={{ flex: 1 }} size="large" />
          ) : (
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={item => item.id}
              ListEmptyComponent={<Text style={styles.noCommentsText}>No comments yet.</Text>}
              style={{flex: 1}}
            />
          )}

          {replyingTo && (
            <View style={styles.replyingToContainer}>
              <Text style={styles.replyingToText}>Replying to a comment</Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Icon name="close" size={20} color="#333" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Add a comment..."
              value={newComment}
              onChangeText={setNewComment}
            />
            <TouchableOpacity style={styles.postButton} onPress={handlePostComment}>
              <Icon name="send" size={24} color="#C734B4" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  commentContainer: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  commentTextContainer: { flex: 1 },
  commentUsername: { fontWeight: 'bold', marginBottom: 3 },
  commentText: { color: '#333' },
  replyButton: { color: 'gray', marginTop: 5 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
  },
  postButton: { marginLeft: 10, padding: 5 },
  noCommentsText: { textAlign: 'center', marginTop: 50, color: 'gray' },
  replyingToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
  replyingToText: { color: '#333' },
});

export default CommentModal;