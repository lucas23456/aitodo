import React from 'react';
import { StyleSheet, View, Text, Switch, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTodoStore } from '@/store/todoStore';
import Colors from '@/constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function SettingsScreen() {
  const isDarkMode = useTodoStore((state) => state.isDarkMode);
  const toggleDarkMode = useTodoStore((state) => state.toggleDarkMode);
  const { signOut, session } = useAuth();

  const colors = Colors[isDarkMode ? 'dark' : 'light'];

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Sign Out",
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        {session?.user && (
          <Text style={[styles.email, { color: colors.gray }]}>
            {session.user.email}
          </Text>
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* Appearance Settings */}
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

        {/* Account Settings */}
        <View style={[styles.card, { backgroundColor: colors.card, marginTop: 20 }]}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => Alert.alert('Account Info', 'Account settings will be available soon.')}
          >
            <View style={styles.settingInfo}>
              <View style={styles.iconContainer}>
                <MaterialIcons name="person" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>Account Settings</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.gray} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => Alert.alert('Security', 'Security settings will be available soon.')}
          >
            <View style={styles.settingInfo}>
              <View style={styles.iconContainer}>
                <MaterialIcons name="security" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>Security</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.gray} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleSignOut}
          >
            <View style={styles.settingInfo}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
                <MaterialIcons name="logout" size={24} color="#FF3B30" />
              </View>
              <Text style={[styles.settingText, { color: '#FF3B30' }]}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Help and Support */}
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

        <Text style={[styles.version, { color: colors.gray }]}>minimind v1.0.0</Text>
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
  email: {
    fontSize: 14,
    marginTop: 4,
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