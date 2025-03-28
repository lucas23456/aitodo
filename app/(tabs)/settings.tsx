import React from 'react';
import { StyleSheet, View, Text, Switch, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTodoStore } from '@/store/todoStore';
import Colors from '@/constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const isDarkMode = useTodoStore((state) => state.isDarkMode);
  const toggleDarkMode = useTodoStore((state) => state.toggleDarkMode);
  
  const colors = Colors[isDarkMode ? 'dark' : 'light'];
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.iconContainer}>
                <MaterialIcons name="dark-mode" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: colors.lightGray, true: colors.primary }}
              thumbColor={'#fff'}
            />
          </View>
          
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.iconContainer}>
                <MaterialIcons name="notifications" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>Notifications</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.gray} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.iconContainer}>
                <MaterialIcons name="cloud-sync" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>Sync with Cloud</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.gray} />
          </TouchableOpacity>
        </View>
        
        <View style={[styles.card, { backgroundColor: colors.card, marginTop: 20 }]}>
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.iconContainer}>
                <MaterialIcons name="help-outline" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>Help & Feedback</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.gray} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={styles.iconContainer}>
                <MaterialIcons name="info-outline" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>About</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.gray} />
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.version, { color: colors.gray }]}>VoiceTodo v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  version: {
    marginTop: 24,
    marginBottom: 40,
    textAlign: 'center',
    fontSize: 14,
  },
}); 