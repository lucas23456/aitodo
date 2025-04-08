import React, { useEffect } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { View, ActivityIndicator } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import { useTodoStore, initializeStore } from '@/store/todoStore';
import { setupNotificationListeners, requestNotificationPermissions } from '@/utils/notifications';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Separating the AuthWrapper to contain all auth-related logic
function AuthWrapper() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {session ? (
        // User is signed in - show app screens
        <>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="task-details" options={{ title: 'Task Details' }} />
          <Stack.Screen name="task-form" options={{ title: 'Add Task' }} />
          <Stack.Screen name="project-details" options={{ title: 'Project Details' }} />
          <Stack.Screen name="voice-input" options={{ headerShown: false, title: 'Voice Input' }} />
          <Stack.Screen name="notes" options={{ headerShown: false, title: 'Notes' }} />
        </>
      ) : (
        // User is not signed in - show auth screens
        <>
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        </>
      )}
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Создаём ссылку для слушателя уведомлений
  const notificationListener = useRef<Notifications.Subscription>();

  // Инициализация уведомлений и слушателей
  useEffect(() => {
    // Запрашиваем разрешение на уведомления
    requestNotificationPermissions();

    // Настраиваем обработчик действий с уведомлениями
    notificationListener.current = setupNotificationListeners((response) => {
      const taskId = response.notification.request.content.data?.taskId;
      // Здесь можно добавить логику для открытия деталей задачи или другие действия
    });

    // Очищаем слушатель при размонтировании
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
    };
  }, []);

  // Initialize store from AsyncStorage
  useEffect(() => {
    initializeStore().catch(error => {
      // Тихо обрабатываем ошибку
    });
  }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={useColorScheme() === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <AuthWrapper />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
