import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Animated, Easing, View, Text } from 'react-native';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { useColorScheme } from './useColorScheme';
import { router } from 'expo-router';
import { useTodoStore } from '@/store/todoStore';

type FABProps = {
  onPress: () => void;
};

export default function FloatingActionButton({ onPress }: FABProps) {
  const isDarkMode = useTodoStore((state) => state.isDarkMode);
  const colorScheme = useColorScheme();
  const colors = Colors[isDarkMode ? 'dark' : 'light'];
  
  // Animation for button press
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.9,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();
  };
  
  const handleVoicePress = () => {
    router.push('/voice-input');
  };
  
  return (
    <View style={styles.fabContainer}>
      {/* Voice input button */}
      <Animated.View style={[
        styles.container,
        styles.voiceContainer,
        { transform: [{ scale: scaleAnim }] }
      ]}>
        <TouchableOpacity
          style={[styles.button, styles.voiceButton, { backgroundColor: colors.primary }]}
          onPress={handleVoicePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <MaterialIcons name="mic" size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>
      
      {/* Main add button */}
      <Animated.View style={[
        styles.container,
        { transform: [{ scale: scaleAnim }] }
      ]}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <AntDesign name="plus" size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: 24,
    bottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 999,
  },
  container: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  voiceContainer: {
    marginRight: 16,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButton: {
    backgroundColor: '#FF5722',
  },
}); 