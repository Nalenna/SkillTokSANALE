// src/screens/ChatScreen.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';

const ChatScreen = ({ route }: { route: any }) => {
    const { chatId } = route.params;
    const [messages, setMessages] = useState<IMessage[]>([]);
    const auth = getAuth();
    const currentUser = auth.currentUser;

    useEffect(() => {
        const unsubscribe = firestore()
            .collection('chats')
            .doc(chatId)
            .collection('messages')
            .orderBy('createdAt', 'desc')
            .onSnapshot(querySnapshot => {
                const messagesData = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    // Basic validation to prevent crashes if createdAt is null
                    if (!data.createdAt) {
                        return null;
                    }
                    return {
                        _id: doc.id,
                        text: data.text,
                        createdAt: data.createdAt.toDate(),
                        user: data.user,
                    };
                }).filter(Boolean); // Filter out any null messages
                setMessages(messagesData as IMessage[]);
            });

        return () => unsubscribe();
    }, [chatId]);

    const onSend = useCallback((newMessages: IMessage[] = []) => {
        const message = newMessages[0];
        const chatRef = firestore().collection('chats').doc(chatId);

        chatRef.collection('messages').add({
            ...message,
            createdAt: new Date(message.createdAt),
        });

        chatRef.update({
            lastMessage: {
                text: message.text,
                createdAt: new Date(message.createdAt),
            }
        });

    }, [chatId]);

    if (!currentUser) {
        return null;
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <GiftedChat
                messages={messages}
                onSend={messages => onSend(messages)}
                user={{
                    _id: currentUser.uid,
                    name: currentUser.displayName || 'User',
                    avatar: currentUser.photoURL || undefined,
                }}
            />
        </SafeAreaView>
    );
};

export default ChatScreen;