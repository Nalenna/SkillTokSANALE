import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const CAREER_INTERESTS = [
  "Tech & Programming", "Construction & Trades", "Retail & Sales", 
  "Media & Content Creation", "Hospitality & Tourism", "Finance & Accounting",
  "Logistics & Transport", "Law & Public Service", "Culinary Arts",
  "Agriculture & Environmental Work", "DIY & Home Improvement", "Healthcare & Wellness"
];

const CareerInterestScreen = ({ navigation }: { navigation: any }) => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleSave = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "You are not logged in.");
      return navigation.navigate('SignIn');
    }
    if (selectedInterests.length === 0) {
      return Alert.alert("Select Interests", "Please choose at least one interest to continue, or press skip.");
    }
    
    setLoading(true);
    try {
      const userRef = firestore().collection('users').doc(user.uid);
      await userRef.update({
        careerInterests: selectedInterests,
        hasCompletedOnboarding: true,
      });
    } catch (error) {
      console.error("Error saving interests: ", error);
      Alert.alert("Error", "Could not save your interests.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const userRef = firestore().collection('users').doc(user.uid);
      await userRef.update({
        careerInterests: [],
        hasCompletedOnboarding: true,
      });
    } catch (error) {
      console.error("Error skipping: ", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipButton}>Skip</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Choose your Career Interests</Text>
      <Text style={styles.subtitle}>Select the fields you're most passionate about.</Text>
      
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
          <Text style={styles.buttonText}>Save & Continue</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0E7F5', padding: 20, alignItems: 'center' },
  header: { width: '100%', alignItems: 'flex-end', paddingRight: 10, paddingTop: 10 },
  skipButton: { color: '#C734B4', fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'center', marginTop: 10, marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 30 },
  interestChip: { backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, margin: 5, borderWidth: 1, borderColor: '#ddd' },
  selectedChip: { backgroundColor: '#C734B4', borderColor: '#C734B4' },
  interestText: { color: '#333', fontSize: 14 },
  selectedText: { color: '#fff' },
  button: { backgroundColor: '#C734B4', paddingVertical: 15, borderRadius: 8, alignItems: 'center', width: '90%', position: 'absolute', bottom: 50 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

export default CareerInterestScreen;