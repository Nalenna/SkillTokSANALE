// src/screens/CategoriesScreen.tsx

import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';

const CATEGORIES = [
  "STEM", "Reading", "DIY & Home Improvement", "Tech & Programming", 
  "Construction & Trades", "Retail & Sales", "Media & Content Creation", 
  "Hospitality & Tourism", "Finance & Accounting", "Logistics & Transport", 
  "Law & Public Service", "Culinary Arts", "Agriculture & Environmental Work", 
  "Healthcare & Wellness"
];

const CategoriesScreen = ({ navigation }: { navigation: any }) => {
  const renderCategory = ({ item }: { item: string }) => (
    <TouchableOpacity 
      style={styles.categoryItem} 
      onPress={() => navigation.navigate('PostGrid', { category: item })}
    >
      <Text style={styles.categoryText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={theme.styles.container}>
      <Text style={theme.styles.title}>Categories</Text>
      <FlatList
        data={CATEGORIES}
        renderItem={renderCategory}
        keyExtractor={(item) => item}
        numColumns={2}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  categoryItem: {
    flex: 1,
    margin: 10,
    height: 120,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  categoryText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default CategoriesScreen;