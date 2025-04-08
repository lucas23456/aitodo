import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Switch, TextInput, Image } from 'react-native';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useColorScheme } from 'react-native';
import Colors from '../constants/Colors';
import { useTodoStore } from '../store/todoStore';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

export default function Account({ session }: { session: Session }) {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [username, setUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const colorScheme = useColorScheme();
  const isDarkMode = useTodoStore((state) => state.isDarkMode);
  const toggleDarkMode = useTodoStore((state) => state.toggleDarkMode);
  const tasks = useTodoStore((state) => state.tasks);
  
  // Task statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const highPriorityTasks = tasks.filter(task => task.priority === 'high' && !task.completed).length;
  const overdueTasks = tasks.filter(task => {
    if (task.completed) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate < new Date();
  }).length;

  useEffect(() => {
    if (session) getProfile();
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      const { user } = session;

      let { data, error, status } = await supabase
        .from('profiles')
        .select(`username, email`)
        .eq('id', user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setUsername(data.username);
        setNewUsername(data.username);
        setEmail(data.email || user.email);
      }
    } catch (error) {
      Alert.alert('Error', 'Error loading user data!');
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  async function checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', session.user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // No matching username found (good)
        return true;
      }
      
      if (data) {
        // Username exists
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  }

  async function updateProfile() {
    try {
      setUpdating(true);
      setError('');

      // Validate username
      if (!newUsername.trim()) {
        setError('Username cannot be empty');
        return;
      }

      if (newUsername.length < 3) {
        setError('Username must be at least 3 characters long');
        return;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
        setError('Username can only contain letters, numbers, and underscores');
        return;
      }

      // Check if username is available
      const isAvailable = await checkUsernameAvailability(newUsername);
      if (!isAvailable) {
        setError('Username is already taken');
        return;
      }

      const { user } = session;
      const updates = {
        id: user.id,
        username: newUsername,
        updated_at: new Date(),
      };

      let { error } = await supabase.from('profiles').upsert(updates);

      if (error) {
        throw error;
      }

      setUsername(newUsername);
      setIsEditing(false);
      Alert.alert('Success', 'Username updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update username. Please try again.');
      console.log(error);
    } finally {
      setUpdating(false);
    }
  }

  async function signOut() {
    try {
      setLoading(true);
      let { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      Alert.alert('Error', 'Error signing out!');
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  const colors = Colors[isDarkMode ? 'dark' : 'light'];
  
  // Pastel colors for statistics
  const pastelColors = {
    primary: isDarkMode ? 'rgba(125, 187, 245, 0.8)' : 'rgba(0, 0, 0, 0.8)',
    success: isDarkMode ? 'rgba(76, 175, 80, 0.7)' : 'rgba(0, 100, 0, 0.7)',
    warning: isDarkMode ? 'rgba(255, 193, 7, 0.7)' : 'rgba(68, 68, 68, 0.7)',
    danger: isDarkMode ? 'rgba(244, 67, 54, 0.7)' : 'rgba(139, 0, 0, 0.7)',
    error: isDarkMode ? 'rgba(239, 83, 80, 0.7)' : 'rgba(211, 47, 47, 0.7)',
    calendar: isDarkMode ? 'rgba(125, 187, 245, 0.7)' : 'rgba(0, 0, 0, 0.7)',
  };

  // Getting the first letter of email for avatar
  const avatarLetter = email ? email.charAt(0).toUpperCase() : 'U';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          {/* User Avatar and Header */}
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarCircle, { backgroundColor: pastelColors.primary }]}>
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            </View>
            <Text style={[styles.userEmail, { color: colors.text }]}>{email || session?.user.email}</Text>
          </View>
          
          {/* User Profile Card */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-outline" size={20} color={pastelColors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>Account Settings</Text>
            </View>
            
            <View style={styles.cardDivider} />
            
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Username</Text>
                {!isEditing && (
                  <TouchableOpacity 
                    style={styles.editButton} 
                    onPress={() => setIsEditing(true)}
                  >
                    <Ionicons name="pencil-outline" size={18} color={pastelColors.primary} />
                  </TouchableOpacity>
                )}
              </View>
              
              {isEditing ? (
                <View>
                  <TextInput
                    style={[
                      styles.usernameInput,
                      { 
                        backgroundColor: isDarkMode ? 'rgba(68, 68, 68, 0.5)' : 'rgba(240, 240, 240, 0.5)',
                        color: colors.text,
                        borderColor: error ? pastelColors.error : 'transparent'
                      }
                    ]}
                    value={newUsername}
                    onChangeText={setNewUsername}
                    placeholder="Enter new username"
                    placeholderTextColor={colors.secondaryText}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!updating}
                  />
                  {error ? (
                    <Text style={[styles.errorText, { color: pastelColors.error }]}>{error}</Text>
                  ) : null}
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                      style={[styles.button, { backgroundColor: 'transparent', borderWidth: 1, borderColor: pastelColors.danger }]}
                      onPress={() => {
                        setIsEditing(false);
                        setNewUsername(username);
                        setError('');
                      }}
                      disabled={updating}
                    >
                      <Text style={[styles.buttonText, { color: pastelColors.danger }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.button, { backgroundColor: pastelColors.success }]}
                      onPress={updateProfile}
                      disabled={updating}
                    >
                      {updating ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.buttonText}>Save</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={[styles.usernameDisplay, { backgroundColor: isDarkMode ? 'rgba(68, 68, 68, 0.3)' : 'rgba(240, 240, 240, 0.3)' }]}>
                  <Text style={[styles.inputText, { color: colors.text }]}>
                    {username || 'No username set'}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Theme Toggle */}
            <View style={styles.themeContainer}>
              <View style={styles.themeTextContainer}>
                <Ionicons 
                  name={isDarkMode ? "moon-outline" : "sunny-outline"} 
                  size={18} 
                  color={pastelColors.primary} 
                  style={styles.themeIcon}
                />
                <Text style={[styles.label, { color: colors.text }]}>Dark Mode</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: 'rgba(118, 117, 119, 0.5)', true: `${pastelColors.primary}80` }}
                thumbColor={isDarkMode ? pastelColors.primary : '#f4f3f4'}
                ios_backgroundColor="rgba(118, 117, 119, 0.2)"
                style={styles.themeSwitch}
              />
            </View>
          </View>
          
          {/* Task Statistics Card */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="stats-chart-outline" size={20} color={pastelColors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>Task Statistics</Text>
            </View>
            
            <View style={styles.cardDivider} />
            
            <View style={styles.statsGrid}>
              <View style={[styles.statItem, { backgroundColor: isDarkMode ? 'rgba(36, 36, 36, 0.5)' : 'rgba(248, 248, 248, 0.5)' }]}>
                <Ionicons name="list-outline" size={22} color={pastelColors.primary} />
                <Text style={[styles.statValue, { color: colors.text }]}>{totalTasks}</Text>
                <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Total</Text>
              </View>
              
              <View style={[styles.statItem, { backgroundColor: isDarkMode ? 'rgba(36, 36, 36, 0.5)' : 'rgba(248, 248, 248, 0.5)' }]}>
                <Ionicons name="checkmark-circle-outline" size={22} color={pastelColors.success} />
                <Text style={[styles.statValue, { color: colors.text }]}>{completedTasks}</Text>
                <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Done</Text>
              </View>
              
              <View style={[styles.statItem, { backgroundColor: isDarkMode ? 'rgba(36, 36, 36, 0.5)' : 'rgba(248, 248, 248, 0.5)' }]}>
                <Ionicons name="time-outline" size={22} color={pastelColors.warning} />
                <Text style={[styles.statValue, { color: colors.text }]}>{pendingTasks}</Text>
                <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Pending</Text>
              </View>
              
              <View style={[styles.statItem, { backgroundColor: isDarkMode ? 'rgba(36, 36, 36, 0.5)' : 'rgba(248, 248, 248, 0.5)' }]}>
                <Ionicons name="flag-outline" size={22} color={pastelColors.danger} />
                <Text style={[styles.statValue, { color: colors.text }]}>{highPriorityTasks}</Text>
                <Text style={[styles.statLabel, { color: colors.secondaryText }]}>High Priority</Text>
              </View>
              
              <View style={[styles.statItem, { backgroundColor: isDarkMode ? 'rgba(36, 36, 36, 0.5)' : 'rgba(248, 248, 248, 0.5)' }]}>
                <Ionicons name="alert-circle-outline" size={22} color={pastelColors.error} />
                <Text style={[styles.statValue, { color: colors.text }]}>{overdueTasks}</Text>
                <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Overdue</Text>
              </View>
              
              <View style={[styles.statItem, { backgroundColor: isDarkMode ? 'rgba(36, 36, 36, 0.5)' : 'rgba(248, 248, 248, 0.5)' }]}>
                <Ionicons name="calendar-outline" size={22} color={pastelColors.calendar} />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {format(new Date(), 'MMM d')}
                </Text>
                <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Today</Text>
              </View>
            </View>
          </View>
          
          {/* Sign Out Button */}
          <TouchableOpacity 
            style={styles.signOutButton}
            onPress={() => signOut()}
            disabled={loading}
          >
            <Ionicons name="log-out-outline" size={18} color={isDarkMode ? "#FFF" : "#FFF"} style={styles.signOutIcon} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  // Avatar styles
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.7,
  },
  // Card styles
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Input styles
  inputContainer: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
  editButton: {
    padding: 4,
  },
  usernameDisplay: {
    borderRadius: 12,
    padding: 14,
  },
  inputText: {
    fontSize: 15,
  },
  usernameInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  // Theme toggle
  themeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  themeTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeIcon: {
    marginRight: 8,
  },
  themeSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  // Stats styles
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    width: '30%',
    padding: 12,
    marginBottom: 16,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
  },
  // Sign out button
  signOutButton: {
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
  },
  signOutText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  signOutIcon: {
    marginRight: 8,
  },
}); 