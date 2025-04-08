import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';

type CapsuleMenuProps = {};

export default function CapsuleMenu({}: CapsuleMenuProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const currentPath = usePathname();
  
  // Determine which screen is active to highlight the icon
  const isHomeActive = currentPath === '/' || currentPath === '/index';
  const isUpcomingActive = currentPath === '/upcoming';
  const isProfileActive = currentPath === '/profile';
  const isVoiceActive = currentPath === '/voice-input';
  
  const handleNavigate = (path: string) => {
    if (path === '/') {
      router.push('/');
    } else if (path === '/upcoming') {
      router.push('/upcoming');
    } else if (path === '/profile') {
      router.push('/profile');
    } else if (path === '/voice-input') {
      router.push('/voice-input');
    }
  };
  
  return (
    <View style={[styles.capsuleMenuContainer, { backgroundColor: colors.background }]}>
      <View style={[styles.capsuleMenu, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          style={styles.capsuleButton}
          onPress={() => handleNavigate('/')}
        >
          <MaterialIcons 
            name="home" 
            size={24} 
            color={isHomeActive ? colors.primary : colors.text} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.capsuleButton}
          onPress={() => handleNavigate('/upcoming')}
        >
          <MaterialIcons 
            name="event" 
            size={24} 
            color={isUpcomingActive ? colors.primary : colors.text} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.capsuleButton}
          onPress={() => handleNavigate('/voice-input')}
        >
          <MaterialIcons 
            name="mic" 
            size={24} 
            color={isVoiceActive ? colors.primary : colors.text} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.capsuleButton}
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
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
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
}); 