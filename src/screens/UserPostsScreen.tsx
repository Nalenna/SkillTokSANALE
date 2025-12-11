// src/screens/UserPostsScreen.tsx

import React, { useState, useCallback } from 'react';
import { View, FlatList, Dimensions, StyleSheet } from 'react-native';
import VideoPlayer from '../components/VideoPlayer';
import ImagePlayer from '../components/ImagePlayer'; // Import ImagePlayer

const { height } = Dimensions.get('window');

const UserPostsScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const { videos: posts, startIndex } = route.params; // Rename for clarity
  const [activePostIndex, setActivePostIndex] = useState(startIndex);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: any[] }) => {
    if (viewableItems.length > 0) {
      setActivePostIndex(viewableItems[0].index);
    }
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={({ item, index }) => {
          if (item.type === 'image') {
            return <ImagePlayer item={item} isActive={index === activePostIndex} navigation={navigation} />;
          }
          return <VideoPlayer item={item} isActive={index === activePostIndex} navigation={navigation} />;
        }}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        initialScrollIndex={startIndex}
        getItemLayout={(data, index) => ({
            length: height,
            offset: height * index,
            index,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
});

export default UserPostsScreen;