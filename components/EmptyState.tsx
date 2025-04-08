import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { useColorScheme } from './useColorScheme';

type EmptyStateProps = {
  message?: string;
};

export default function EmptyState({ message = 'No tasks yet!' }: EmptyStateProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colorScheme === 'dark' ? colors.lightGray : '#F0F0F5' }]}>
        <MaterialCommunityIcons 
          name="clipboard-text-outline" 
          size={64} 
          color="white" 
        />
      </View>
      <Text style={[styles.message, { color: colors.text }]}>
        {message}
      </Text>
      <Text style={[styles.subMessage, { color: colors.gray }]}>
        Tap the + button to add a new task
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  message: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subMessage: {
    fontSize: 16,
    textAlign: 'center',
  },
}); 