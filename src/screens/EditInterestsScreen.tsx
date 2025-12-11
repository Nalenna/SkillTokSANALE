// src/screens/EditInterestsScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { theme } from '../theme/theme';

const CAREER_INTERESTS = [
  "Tech & Programming", "Construction & Trades", "Retail & Sales", 
  "Media & Content Creation", "Hospitality & Tourism", "Finance & Accounting",
  "Logistics & Transport", "Law & Public Service", "Culinary Arts",
  "Agriculture & Environmental Work", "DIY & Home Improvement", "Healthcare & Wellness"
];

const EditInterestsScreen = ({ navigation }: { navigation: any }) => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
        const userDocRef = firestore().collection('users').doc(user.uid);
        userDocRef.get().then(doc => {
            if (doc.exists) {
                setSelectedInterests(doc.data()?.careerInterests || []);
            }
        }).finally(() => setLoading(false));
    } else {
        setLoading(false);
    }
  }, [user]);


  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleSave = async () => {
    if (!user) {
      return Alert.alert("Error", "You are not logged in.");
    }
    
    setLoading(true);
    try {
      const userRef = firestore().collection('users').doc(user.uid);
      await userRef.update({
        careerInterests: selectedInterests,
      });
      Alert.alert("Success", "Your interests have been updated.");
      navigation.goBack();
    } catch (error) {
      console.error("Error saving interests: ", error);
      Alert.alert("Error", "Could not save your interests.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
      return <SafeAreaView style={styles.container}><ActivityIndicator size="large" color={theme.colors.primary}/></SafeAreaView>
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Update Your Interests</Text>
        <Text style={styles.subtitle}>This helps us recommend more relevant content for you.</Text>
        
        <View style={styles.grid}>
          {CAREER_INTERESTS.map((interest) => (
            <TouchableOpacity 
              key={interest} 
              style={[
                styles.interestChip, 
                selectedInterests.includes(interest) && styles.selectedChip
              ]}
              onPress={() => toggleInterest(interest)}
            >
              <Text style={[
                styles.interestText,
                selectedInterests.includes(interest) && styles.selectedText
              ]}>
                {interest}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0E7F5', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'center', marginTop: 10, marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 30 },
  interestChip: { backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, margin: 5, borderWidth: 1, borderColor: '#ddd' },
  selectedChip: { backgroundColor: '#C734B4', borderColor: '#C734B4' },
  interestText: { color: '#333', fontSize: 14 },
  selectedText: { color: '#fff' },
  button: { backgroundColor: '#C734B4', paddingVertical: 15, borderRadius: 8, alignItems: 'center', width: '100%', marginTop: 20 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

export default EditInterestsScreen;