import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';

import { useColorScheme } from '@/components/useColorScheme';
import { useTodoStore, initializeStore } from '@/store/todoStore';
import { setupNotificationListeners, requestNotificationPermissions } from '@/utils/notifications';

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

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const isDarkMode = useTodoStore(state => state.isDarkMode);

  // Use the custom dark mode state from the store instead of system setting
  const theme = isDarkMode ? DarkTheme : DefaultTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={theme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
