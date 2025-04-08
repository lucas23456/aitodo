import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { Alert, Platform } from 'react-native';

type AuthContextType = {
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Обработка URL для глубоких ссылок
  const handleDeepLink = async (url: string | null) => {
    if (!url) return;

    console.log('Deep link received:', url);
    
    // Обрабатываем URL для подтверждения email
    // Формат URL обычно такой: myapp://auth/callback?type=email_confirmation&...
    if (url.includes('auth/callback') || url.includes('email-confirmation')) {
      try {
        setIsLoading(true);
        
        // Supabase автоматически обработает параметры URL
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error processing confirmation link:', error);
          Alert.alert('Ошибка', 'Не удалось подтвердить email. Пожалуйста, попробуйте снова.');
        } else if (data.session) {
          console.log('Email confirmed successfully');
          setSession(data.session);
          
          // Перенаправляем на профиль после успешного подтверждения
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('Error handling deep link:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Настройка обработчика глубоких ссылок
  useEffect(() => {
    // Обработка URL, если приложение открыто по ссылке
    const getInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      handleDeepLink(initialUrl);
    };
    
    getInitialURL();

    // Слушаем входящие ссылки, когда приложение уже запущено
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      setSession(session);

      if (event === 'SIGNED_OUT') {
        // Redirect to login when signed out
        router.replace('/auth/login');
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        // Redirect to home when signed in or when user data is updated
        router.replace('/(tabs)');
      }
    });

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 