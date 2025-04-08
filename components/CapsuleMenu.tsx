import React from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import { useTodoStore } from '@/store/todoStore';

type CapsuleMenuProps = {};

export default function CapsuleMenu({ }: CapsuleMenuProps) {
  const colorScheme = useColorScheme();
  const isDarkMode = useTodoStore((state) => state.isDarkMode);
  const colors = Colors[isDarkMode ? 'dark' : 'light'];
  const currentPath = usePathname();

  // Determine which screen is active to highlight the icon
  const isHomeActive = currentPath === '/' || currentPath === '/index';
  const isProfileActive = currentPath === '/profile';
  const isVoiceActive = currentPath === '/voice-input';
  const isNotesActive = currentPath === '/notes';

  const handleNavigate = (path: string) => {
    if (path === '/') {
      router.push('/');
    } else if (path === '/profile') {
      router.push('/profile');
    } else if (path === '/voice-input') {
      router.push('/voice-input');
    } else if (path === '/notes') {
      router.push('/notes');
    }
  };

  return (
    <View style={[
      styles.capsuleMenuContainer, 
      { 
        backgroundColor: isDarkMode ? 'rgba(36, 36, 36, 0.7)' : colors.background,
        borderWidth: isDarkMode ? 1 : 0,
        borderColor: isDarkMode ? 'rgba(125, 187, 245, 0.2)' : 'transparent'
      }
    ]}>
      <View style={[
        styles.capsuleMenu, 
        { 
          backgroundColor: isDarkMode ? 'rgba(18, 18, 18, 0.8)' : colors.card,
          borderWidth: isDarkMode ? 1 : 0,
          borderColor: isDarkMode ? 'rgba(125, 187, 245, 0.1)' : 'transparent'
        }
      ]}>
        <TouchableOpacity 
          style={[
            styles.capsuleButton,
            isHomeActive && isDarkMode && styles.activeButtonDark,
            isHomeActive && !isDarkMode && styles.activeButtonLight
          ]}
          onPress={() => handleNavigate('/')}
        >
          <MaterialIcons
            name="home"
            size={24}
            color={isHomeActive ? colors.primary : colors.text}
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.capsuleButton,
            isVoiceActive && isDarkMode && styles.activeButtonDark,
            isVoiceActive && !isDarkMode && styles.activeButtonLight
          ]}
          onPress={() => handleNavigate('/voice-input')}
        >
          <MaterialIcons
            name="mic"
            size={24}
            color={isVoiceActive ? colors.primary : colors.text}
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.capsuleButton,
            isProfileActive && isDarkMode && styles.activeButtonDark,
            isProfileActive && !isDarkMode && styles.activeButtonLight
          ]}
          onPress={() => handleNavigate('/profile')}
        >
          <MaterialIcons
            name="person"
            size={24}
            color={isProfileActive ? colors.primary : colors.text}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  capsuleMenuContainer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
  },
  capsuleMenu: {
    flexDirection: 'row',
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  capsuleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  activeButtonDark: {
    backgroundColor: 'rgba(125, 187, 245, 0.15)',
    shadowColor: 'rgba(125, 187, 245, 0.5)',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  activeButtonLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  }
}); 