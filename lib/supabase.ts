import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

// Supabase configuration
const supabaseUrl = 'https://aonlvdzdlmzzxaswikvc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvbmx2ZHpkbG16enhhc3dpa3ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1ODc0NTksImV4cCI6MjA1OTE2MzQ1OX0.n76zax4AgzoYiv5sp_BCaDhzGmRJgWLCBgeqY1TWI5o';

// Создаём URL для глубоких ссылок
const getAuthUrl = () => {
  // Возвращает URL-схему minimind:// или https:// для веб-версии
  return Linking.createURL('auth/callback');
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'x-application-name': 'minimind',
    },
  },
}); 