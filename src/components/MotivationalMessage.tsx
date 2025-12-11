import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { IconFallback as Icon } from '../utils/IconHelper';

const MESSAGES = [
  "Believe you can and you're halfway there.",
  "The only way to do great work is to love what you do.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "Don't watch the clock; do what it does. Keep going."
];

const MotivationalMessage = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Pick a random message when the component mounts
    const randomIndex = Math.floor(Math.random() * MESSAGES.length);
    setMessage(MESSAGES[randomIndex]);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.messageText}>{message}</Text>
      <TouchableOpacity onPress={() => setIsVisible(false)} style={styles.closeButton}>
        <Icon name="close-circle" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000, // Ensure it's on top
  },
  messageText: {
    color: 'white',
    flex: 1,
    marginRight: 10,
  },
  closeButton: {
    padding: 5,
  },
});

export default MotivationalMessage;