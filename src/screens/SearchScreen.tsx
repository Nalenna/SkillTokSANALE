// src/screens/SearchScreen.tsx

import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import { theme } from '../theme/theme';
import { debounce } from 'lodash';

interface User {
  id: string;
  displayName: string;
  username: string;
  profilePic: string;
}

const SearchScreen = ({ navigation }: { navigation: any }) => {
  const [searchText, setSearchText] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const performSearch = async (query: string) => {
    const trimmedQuery = query.trim().toLowerCase();
    if (trimmedQuery === '') {
      setUsers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // This query finds usernames that start with the search text.
      // It's a robust alternative to keyword search.
      const usersQuery = firestore()
        .collection("users")
        .where("username", ">=", trimmedQuery)
        .where("username", "<=", trimmedQuery + '\uf8ff')
        .limit(20);
        
      const querySnapshot = await usersQuery.get();
      const usersData: User[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
      setUsers(usersData);
    } catch (error) {
      console.error("Error searching users:", error);
      Alert.alert("Search Error", "Could not perform search at this time.");
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(debounce(performSearch, 400), []);

  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
    if (text.trim() !== '') {
        setLoading(true);
    } else {
        setUsers([]);
        setLoading(false);
    }
    debouncedSearch(text);
  };
  
  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.userItem} onPress={() => navigation.navigate('UserProfile', { userId: item.id })}>
      <Image source={{ uri: item.profilePic || 'https://via.placeholder.com/50' }} style={styles.userImage} />
      <View>
        <Text style={styles.userName}>{item.displayName}</Text>
        <Text style={styles.userHandle}>@{item.username}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
            <Text style={theme.styles.title}>Search Users</Text>
            <TextInput
                style={theme.styles.input}
                placeholder="Search by username..."
                value={searchText}
                onChangeText={handleSearchTextChange}
                autoCapitalize="none"
                autoCorrect={false}
            />
            {loading ? (
                <ActivityIndicator style={{marginTop: 50}} size="large" color={theme.colors.primary} />
            ) : (
                <FlatList
                    data={users}
                    renderItem={renderUser}
                    keyExtractor={(item) => item.id}
                    ListEmptyComponent={<Text style={styles.emptyText}>No users found.</Text>}
                />
            )}
        </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    container: { flex: 1, padding: 20 },
    userItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    userImage: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
    userName: { fontSize: 16, fontWeight: 'bold', color: theme.colors.text },
    userHandle: { fontSize: 14, color: theme.colors.inactive },
    emptyText: { textAlign: 'center', marginTop: 50, color: theme.colors.inactive, fontSize: 16 },
});

export default SearchScreen;