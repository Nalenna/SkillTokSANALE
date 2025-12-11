// src/screens/ChatListScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useIsFocused } from '@react-navigation/native';
import { theme } from '../theme/theme';

const ChatListScreen = ({ navigation }: { navigation: any }) => {
    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const isFocused = useIsFocused();

    useEffect(() => {
        if (!currentUser || !isFocused) return;

        setLoading(true);
        const unsubscribe = firestore()
            .collection('chats')
            .where('users', 'array-contains', currentUser.uid)
            .orderBy('lastMessage.createdAt', 'desc')
            .onSnapshot(querySnapshot => {
                const chatsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setChats(chatsData);
                setLoading(false);
            }, error => {
                console.error("Error fetching chats: ", error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, [currentUser, isFocused]);

    const renderChatItem = ({ item }: { item: any }) => {
        const otherUser = item.userData.find((u: any) => u.uid !== currentUser?.uid);
        if (!otherUser) return null;

        return (
            <TouchableOpacity 
                style={styles.chatItem} 
                onPress={() => navigation.navigate('Chat', { chatId: item.id, otherUser })}
            >
                <Image source={{ uri: otherUser.profilePic }} style={styles.avatar} />
                <View style={styles.chatInfo}>
                    <Text style={styles.username}>{otherUser.displayName}</Text>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                        {item.lastMessage?.text || 'No messages yet'}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={theme.styles.container}>
            <Text style={theme.styles.title}>Messages</Text>
            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} />
            ) : (
                <FlatList
                    data={chats}
                    renderItem={renderChatItem}
                    keyExtractor={item => item.id}
                    ListEmptyComponent={<Text style={styles.emptyText}>You have no messages yet.</Text>}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        width: '100%',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    chatInfo: {
        flex: 1,
    },
    username: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    lastMessage: {
        fontSize: 14,
        color: theme.colors.inactive,
        marginTop: 4,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: theme.colors.inactive,
        fontSize: 16,
    },
});

export default ChatListScreen;