import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import Account from '../../components/Account';
import { useAuth } from '../../contexts/AuthContext';
import { Stack } from 'expo-router';
import { useTodoStore } from '@/store/todoStore';
import Colors from '@/constants/Colors';
import CapsuleMenu from '@/components/CapsuleMenu';

export default function ProfileScreen() {
  const { session } = useAuth();
  const isDarkMode = useTodoStore((state) => state.isDarkMode);
  const colors = Colors[isDarkMode ? 'dark' : 'light'];

  if (!session) {
    return null; // Should not happen due to auth routing, but for safety
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'My Profile',
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Account session={session} />
      <CapsuleMenu />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 