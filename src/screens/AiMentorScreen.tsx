// src/screens/AiMentorScreen.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { getAuth } from '@react-native-firebase/auth';
import { Alert } from 'react-native';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { SafeAreaView } from 'react-native-safe-area-context';

const AiMentorScreen = () => {
    const [messages, setMessages] = useState<IMessage[]>([]);
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const aiUser = { _id: 'gemini-ai', name: 'AI Mentor' };

    useEffect(() => {
        setMessages([
            {
                _id: '1',
                text: 'Hello! I am your AI Mentor. How can I help you with your career goals today?',
                createdAt: new Date(),
                user: aiUser,
            },
        ]);
    }, []);

    const onSend = useCallback(async (newMessages: IMessage[] = []) => {
        const userMessage = newMessages[0];
        setMessages(previousMessages => GiftedChat.append(previousMessages, userMessage));

        try {
            const getAiResponse = httpsCallable(getFunctions(), 'getAiResponse');
            const response = await getAiResponse({ prompt: userMessage.text });
            const aiResponseText = response.data.text;
            
            const aiMessage: IMessage = {
                _id: Math.random().toString(),
                text: aiResponseText,
                createdAt: new Date(),
                user: aiUser,
            };
            setMessages(previousMessages => GiftedChat.append(previousMessages, aiMessage));

        } catch (error) {
            console.error("Error fetching AI response:", error);
            Alert.alert("Error", "Could not get a response from the AI Mentor.");
        }
    }, []);

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

export default AiMentorScreen;