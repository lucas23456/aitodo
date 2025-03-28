import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useTodoStore } from '@/store/todoStore';
import TaskForm from '@/components/TaskForm';
import CapsuleMenu from '@/components/CapsuleMenu';
import Colors from '@/constants/Colors';

export default function TaskDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDarkMode = useTodoStore((state) => state.isDarkMode);
  const colors = Colors[isDarkMode ? 'dark' : 'light'];
  
  const task = useTodoStore((state) => state.tasks.find(t => t.id === id));
  const toggleTaskStatus = useTodoStore((state) => state.toggleTaskStatus);
  const deleteTask = useTodoStore((state) => state.deleteTask);
  
  const [isFormVisible, setIsFormVisible] = useState(false);
  
  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Task not found</Text>
        
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.card }]}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          <Text style={[styles.backButtonText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const handleEdit = () => {
    setIsFormVisible(true);
  };
  
  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteTask(task.id);
            router.back();
          }
        }
      ]
    );
  };
  
  // Format the date for display
  const formattedDate = task.dueDate ? format(new Date(task.dueDate), 'PPPP') : 'No due date';
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.card }]}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={handleEdit}
            >
              <MaterialIcons name="edit" size={24} color={colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={handleDelete}
            >
              <MaterialIcons name="delete" size={24} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Task title and status */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>{task.title}</Text>
          
          <TouchableOpacity
            style={[
              styles.statusButton,
              { backgroundColor: task.completed ? colors.success : colors.card }
            ]}
            onPress={() => toggleTaskStatus(task.id)}
          >
            <MaterialIcons
              name={task.completed ? "check-circle" : "radio-button-unchecked"}
              size={24}
              color={task.completed ? colors.text : colors.text}
            />
            <Text
              style={[
                styles.statusText,
                { color: colors.text }
              ]}
            >
              {task.completed ? "Completed" : "Mark as Complete"}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Task details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>Details</Text>
          
          <View style={[styles.detailsCard, { backgroundColor: colors.card }]}>
            <View style={styles.detailRow}>
              <MaterialIcons name="event" size={20} color={colors.primary} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                Due: {formattedDate}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <MaterialIcons name="flag" size={20} color={colors.primary} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                Priority: {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </Text>
            </View>
            
            {task.category && (
              <View style={styles.detailRow}>
                <MaterialIcons name="category" size={20} color={colors.primary} />
                <Text style={[styles.detailText, { color: colors.text }]}>
                  Category: {task.category}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Description section */}
        {task.description && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>Description</Text>
            <View style={[styles.descriptionCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.description, { color: colors.text }]}>{task.description}</Text>
            </View>
          </View>
        )}
      </ScrollView>
      
      <CapsuleMenu />
      
      <TaskForm
        visible={isFormVisible}
        onClose={() => setIsFormVisible(false)}
        onSubmit={() => {}}
        initialTask={task}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 20,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 10,
    borderRadius: 20,
    marginLeft: 8,
  },
  titleContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  detailsCard: {
    borderRadius: 16,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    marginLeft: 12,
  },
  descriptionCard: {
    borderRadius: 16,
    padding: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    margin: 20,
  },
}); 