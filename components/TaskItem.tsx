import React from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { categoryColors, priorityColors, tagColors } from '../constants/Colors';
import { useColorScheme } from '../components/useColorScheme';
import { Task } from '../store/todoStore';
import { format, isToday, isTomorrow, isPast } from 'date-fns';

type TaskItemProps = {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onPress: (task: Task) => void;
  onEdit?: (task: Task) => void;
};

export default function TaskItem({ task, onToggleComplete, onDelete, onPress, onEdit }: TaskItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });
    
    return (
      <View style={styles.rightActions}>
        <Animated.View style={{ transform: [{ translateX: trans }] }}>
          <TouchableOpacity 
            style={[styles.action, { backgroundColor: colors.danger }]}
            onPress={() => onDelete(task.id)}
          >
            <MaterialIcons name="delete" size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };
  
  const renderLeftActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const trans = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [-100, 0],
      extrapolate: 'clamp',
    });
    
    return (
      <View style={styles.leftActions}>
        <Animated.View style={{ transform: [{ translateX: trans }] }}>
          <TouchableOpacity 
            style={[styles.action, { backgroundColor: colors.success }]}
            onPress={() => onToggleComplete(task.id)}
          >
            <MaterialIcons name={task.completed ? "replay" : "check"} size={24} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };
  
  // Format due date for display
  const formatDueDate = (dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    
    return format(date, 'MMM d');
  };
  
  // Determine if task is overdue
  const isOverdue = () => {
    if (!task.dueDate || task.completed) return false;
    
    const dueDate = new Date(task.dueDate);
    return isPast(dueDate) && !isToday(dueDate);
  };

  // Get priority color
  const getPriorityColor = () => {
    return task.priority ? priorityColors[task.priority] : priorityColors.medium;
  };

  // Get category color
  const getCategoryColor = () => {
    return task.category && categoryColors[task.category as keyof typeof categoryColors] 
      ? categoryColors[task.category as keyof typeof categoryColors] 
      : categoryColors.Other;
  };
  
  // Display simple task view instead of the full-featured one to match the design
  if (true) {
    return (
      <View style={styles.minimalContainer}>
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={[
              styles.checkbox,
              { 
                borderColor: colors.text,
                borderWidth: 1 
              }
            ]}
            onPress={() => onToggleComplete(task.id)}
          >
            {task.completed && (
              <MaterialIcons name="check" size={14} color={colors.text} />
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.contentContainer}>
          <TouchableOpacity onPress={() => onPress(task)}>
            <Text 
              style={[
                styles.taskTitle, 
                { 
                  color: colors.text,
                  textDecorationLine: task.completed ? 'line-through' : 'none' 
                }
              ]}
              numberOfLines={2}
            >
              {task.title}
            </Text>
            
            {/* Show description if available */}
            {task.description ? (
              <Text 
                style={[styles.taskDescription, { color: colors.secondaryText }]}
                numberOfLines={1}
              >
                {task.description}
              </Text>
            ) : null}
            
            {/* Show due date in a more visible way */}
            {task.dueDate ? (
              <View style={styles.dateContainer}>
                <MaterialIcons name="event" size={12} color={colors.secondaryText} />
                <Text style={[styles.dateText, { color: colors.secondaryText }]}>
                  {formatDueDate(task.dueDate)}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
        
        <View style={styles.timeContainer}>
          <Text style={[styles.timeText, { color: colors.secondaryText }]}>
            {task.estimatedTime || '30 min'}
          </Text>
        </View>
      </View>
    );
  }
  
  return (
    <Swipeable
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
    >
      <TouchableOpacity 
        style={[
          styles.container, 
          { backgroundColor: colors.card },
          task.completed && styles.completedTask
        ]}
        onPress={() => onPress(task)}
        activeOpacity={0.7}
      >
        <View style={styles.leftSection}>
          <TouchableOpacity 
            style={[styles.checkbox, { 
              borderColor: task.completed ? colors.success : colors.gray,
              backgroundColor: task.completed ? colors.success : 'transparent'
            }]}
            onPress={() => onToggleComplete(task.id)}
          >
            {task.completed && <AntDesign name="check" size={16} color={colorScheme === 'dark' ? '#000' : 'white'} />}
          </TouchableOpacity>
          
          {/* Category indicator */}
          {task.category && (
            <View 
              style={[
                styles.categoryIndicator, 
                { backgroundColor: getCategoryColor(), opacity: 0.8 }
              ]} 
            />
          )}
        </View>
        
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text 
              style={[
                styles.title, 
                { color: colors.text },
                task.completed && styles.completedText
              ]}
              numberOfLines={1}
            >
              {task.title}
            </Text>
            
            {/* Priority indicator */}
            <View 
              style={[
                styles.priorityIndicator, 
                { backgroundColor: getPriorityColor(), opacity: 0.8 }
              ]} 
            />
          </View>
          
          {/* Tags row */}
          {task.tags && task.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {task.tags.slice(0, 2).map((tag, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.tag, 
                    { 
                      backgroundColor: tagColors[tag as keyof typeof tagColors] || colors.gray,
                      opacity: task.completed ? 0.6 : 1
                    }
                  ]}
                >
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
              {task.tags.length > 2 && (
                <Text style={[styles.moreTag, { color: colors.gray }]}>
                  +{task.tags.length - 2}
                </Text>
              )}
            </View>
          )}
          
          {/* Description preview */}
          {task.description ? (
            <Text 
              style={[styles.description, { color: colors.gray }]}
              numberOfLines={1}
            >
              {task.description}
            </Text>
          ) : null}
        </View>
        
        {task.dueDate ? (
          <View style={styles.dueDateContainer}>
            <Text 
              style={[
                styles.dueDate, 
                { color: isOverdue() ? colors.danger : colors.gray },
                task.completed && styles.completedText
              ]}
            >
              {formatDueDate(task.dueDate)}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIndicator: {
    width: 4,
    height: 36,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tag: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '500',
  },
  moreTag: {
    fontSize: 10,
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    marginTop: 2,
  },
  dueDateContainer: {
    marginLeft: 12,
  },
  dueDate: {
    fontSize: 12,
  },
  rightActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flex: 1,
  },
  leftActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flex: 1,
  },
  action: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 64,
    height: '100%',
    borderRadius: 8,
  },
  completedTask: {
    opacity: 0.7,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  minimalContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
  },
  timeContainer: {
    marginLeft: 12,
  },
  timeText: {
    fontSize: 12,
  },
  taskDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    marginLeft: 4,
  },
}); 