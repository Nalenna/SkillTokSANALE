import React from 'react';
import { Text } from 'react-native';

// This is a fallback component that replaces vector icons
// to prevent crashes when vector icons are not available
export const IconFallback = ({ name, size = 24, color = 'black', style = {} }) => {
  // Just return the first character of the icon name as text
  const iconChar = name && typeof name === 'string' ? name.charAt(0).toUpperCase() : '?';
  
  return (
    <Text 
      style={[{
        width: size,
        height: size,
        textAlign: 'center',
        fontSize: size * 0.6,
        color: color,
      }, style]}
    >
      {iconChar}
    </Text>
  );
};

// Export a fake Icon object that matches the interface of react-native-vector-icons
export default {
  // This creates a component that renders our fallback
  // It matches the usage pattern: <Icon name="icon-name" size={24} color="black" />
  default: IconFallback
};