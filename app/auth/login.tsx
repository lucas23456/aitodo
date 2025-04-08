import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Auth from '../../components/Auth';
import { Stack } from 'expo-router';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Вход',
          headerShown: false,
        }}
      />
      <Auth />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 