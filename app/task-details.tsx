import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { format, isToday, isTomorrow } from 'date-fns';
import { useTodoStore, Task } from '@/store/todoStore';
import TaskForm from '@/components/TaskForm';
import CapsuleMenu from '@/components/CapsuleMenu';
import { TaskReminder } from '@/components/TaskReminder';
import Colors from '@/constants/Colors';
import { priorityColors, categoryColors, getTagColor } from '@/constants/Colors';

export default function TaskDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDarkMode = useTodoStore((state) => state.isDarkMode);
  const colors = Colors[isDarkMode ? 'dark' : 'light'];
  
  const task = useTodoStore((state) => state.tasks.find(t => t.id === id));
  const toggleTaskStatus = useTodoStore((state) => state.toggleTaskStatus);
  const deleteTask = useTodoStore((state) => state.deleteTask);
  const updateTask = useTodoStore((state) => state.updateTask);
  
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

  const handleToggleComplete = () => {
    toggleTaskStatus(task.id);
    
    // If task is now completed, show a success message and return to the main screen
    if (!task.completed) {
      Alert.alert(
        'Task Completed',
        'This task has been marked as complete and moved to the Completed section.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  };

  const handleSubmitEdit = (editedTask: Omit<Task, 'id' | 'createdAt'>) => {
    if (task) {
      const updatedTask = {
        ...task,
        ...editedTask,
      };
      updateTask(updatedTask);
      setIsFormVisible(false);
    }
  };
  
  // Format the date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'No due date';
    
    const date = new Date(dateString);
    
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  // Format the time for display
  const formatTime = (timeString?: string) => {
    if (!timeString) return 'No specific time';
    return timeString;
  };

  // Get priority information
  const getPriorityColor = () => {
    return priorityColors[task.priority];
  };

  // Get priority icon based on level
  const getPriorityIcon = () => {
    switch(task.priority) {
      case 'high':
        return 'flag';
      case 'medium':
        return 'flag-o';
      case 'low':
      default:
        return 'angle-up';
    }
  };

  // Get category color
  const getCategoryColor = () => {
    return task.category && categoryColors[task.category as keyof typeof categoryColors]
      ? categoryColors[task.category as keyof typeof categoryColors]
      : colors.gray;
  };

  // Get repeat text
  const getRepeatText = () => {
    if (!task.repeat || task.repeat.type === 'none') return 'Not repeating';
    
    let text = '';
    switch (task.repeat.type) {
      case 'daily':
        text = task.repeat.interval === 1 ? 'Daily' : `Every ${task.repeat.interval} days`;
        break;
      case 'weekly':
        text = task.repeat.interval === 1 ? 'Weekly' : `Every ${task.repeat.interval} weeks`;
        break;
      case 'monthly':
        text = task.repeat.interval === 1 ? 'Monthly' : `Every ${task.repeat.interval} months`;
        break;
    }
    
    if (task.repeat.endDate) {
      text += ` until ${format(new Date(task.repeat.endDate), 'MMM d, yyyy')}`;
    }
    
    return text;
  };
  
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
              <MaterialIcons name="edit" size={24} color={colors.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card }]}
              onPress={handleDelete}
            >
              <MaterialIcons name="delete" size={24} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Task title with category indicator */}
        <View style={styles.titleContainer}>
          {task.category && (
            <View style={[styles.categoryIndicator, { backgroundColor: getCategoryColor() }]}>
              <Text style={styles.categoryText}>{task.category}</Text>
            </View>
          )}
          <Text style={[styles.title, { color: isDarkMode ? '#FFFFFF' : colors.text }]}>{task.title}</Text>
          
          {/* Enhanced Priority badge */}
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor() }]}>
            <FontAwesome name={getPriorityIcon()} size={14} color="white" style={styles.priorityIcon} />
            <Text style={styles.priorityText}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
            </Text>
          </View>
        </View>
        
        {/* Priority selection row */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>Priority Level</Text>
          <View style={styles.priorityRow}>
            {['low', 'medium', 'high'].map((priority) => (
              <TouchableOpacity
                key={priority}
                style={[
                  styles.priorityOption,
                  { 
                    backgroundColor: task.priority === priority ? priorityColors[priority as keyof typeof priorityColors] : 'transparent',
                    borderColor: priorityColors[priority as keyof typeof priorityColors],
                  }
                ]}
                onPress={() => {
                  updateTask({
                    ...task,
                    priority: priority as 'low' | 'medium' | 'high'
                  });
                }}
              >
                <FontAwesome 
                  name={priority === 'high' ? 'flag' : priority === 'medium' ? 'flag-o' : 'angle-up'} 
                  size={16} 
                  color={task.priority === priority ? 'white' : priorityColors[priority as keyof typeof priorityColors]} 
                  style={styles.priorityOptionIcon}
                />
                <Text 
                  style={[
                    styles.priorityOptionText, 
                    { color: task.priority === priority ? 'white' : priorityColors[priority as keyof typeof priorityColors] }
                  ]}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Completion status button */}
        <TouchableOpacity
          style={[
            styles.statusButton,
            { backgroundColor: task.completed ? colors.success : colors.card }
          ]}
          onPress={handleToggleComplete}
        >
          <MaterialIcons
            name={task.completed ? "check-circle" : "radio-button-unchecked"}
            size={24}
            color={task.completed ? "white" : colors.text}
          />
          <Text
            style={[
              styles.statusText,
              { color: task.completed ? "white" : colors.text }
            ]}
          >
            {task.completed ? "Completed" : "Mark as Complete"}
          </Text>
        </TouchableOpacity>
        
        {/* Description section */}
        {task.description && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>Description</Text>
            <View style={[styles.descriptionCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.description, { color: colors.text }]}>{task.description}</Text>
            </View>
          </View>
        )}

        {/* Tags section */}
        {task.tags && task.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>Tags</Text>
            <View style={styles.tagsContainer}>
              {task.tags.map((tag, index) => (
                <View 
                  key={index} 
                  style={[styles.tagChip, { backgroundColor: getTagColor(tag) }]}
                >
                  <Text style={styles.tagChipText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
          
        {/* Due date and time details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>Date & Time</Text>
          <View style={[styles.detailsCard, { backgroundColor: colors.card }]}>
            <View style={styles.detailRow}>
              <MaterialIcons name="event" size={20} color={colors.primary} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                Due: {formatDate(task.dueDate)}
              </Text>
            </View>
            
            {task.dueTime && (
              <View style={styles.detailRow}>
                <MaterialIcons name="access-time" size={20} color={colors.primary} />
                <Text style={[styles.detailText, { color: colors.text }]}>
                  Time: {formatTime(task.dueTime)}
                </Text>
              </View>
            )}
            
            {/* Repeating task information */}
            {task.repeat && task.repeat.type !== 'none' && (
              <View style={styles.detailRow}>
                <MaterialIcons name="repeat" size={20} color={colors.primary} />
                <Text style={[styles.detailText, { color: colors.text }]}>
                  Repeats: {getRepeatText()}
                </Text>
              </View>
            )}
          </View>
        </View>
            
        {/* Additional details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>Additional Details</Text>
          <View style={[styles.detailsCard, { backgroundColor: colors.card }]}>
            {task.estimatedTime && (
              <View style={styles.detailRow}>
                <MaterialIcons name="timer" size={20} color={colors.primary} />
                <Text style={[styles.detailText, { color: colors.text }]}>
                  Estimated time: {task.estimatedTime}
                </Text>
              </View>
            )}
            
            {task.company && (
              <View style={styles.detailRow}>
                <MaterialIcons name="business" size={20} color={colors.primary} />
                <Text style={[styles.detailText, { color: colors.text }]}>
                  Company: {task.company}
                </Text>
              </View>
            )}
            
            {task.projectId && (
              <View style={styles.detailRow}>
                <MaterialIcons name="folder" size={20} color={colors.primary} />
                <Text style={[styles.detailText, { color: colors.text }]}>
                  Project ID: {task.projectId}
                </Text>
              </View>
            )}
            
            <View style={styles.detailRow}>
              <MaterialIcons name="date-range" size={20} color={colors.primary} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                Created: {format(new Date(task.createdAt), 'MMM d, yyyy')}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Reminders Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>Reminders</Text>
          <TaskReminder 
            task={task}
            onUpdateTask={updateTask}
          />
        </View>
      </ScrollView>
      
      <CapsuleMenu />
      
      <TaskForm
        visible={isFormVisible}
        onClose={() => setIsFormVisible(false)}
        onSubmit={handleSubmitEdit}
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
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  categoryIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  priorityIcon: {
    marginRight: 6,
  },
  priorityText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  priorityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 4,
  },
  priorityOptionIcon: {
    marginRight: 6,
  },
  priorityOptionText: {
    fontWeight: '600',
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
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
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  descriptionCard: {
    borderRadius: 16,
    padding: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  detailsCard: {
    borderRadius: 16,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  detailText: {
    fontSize: 16,
    marginLeft: 12,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
    marginBottom: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagChip: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagChipText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
}); 