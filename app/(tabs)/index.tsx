import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, SectionList, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import { useTodoStore, Task } from '@/store/todoStore';
import { useColorScheme } from '@/components/useColorScheme';
import TaskItem from '@/components/TaskItem';
import TaskForm from '@/components/TaskForm';
import EmptyState from '@/components/EmptyState';
import CapsuleMenu from '@/components/CapsuleMenu';
import Colors from '@/constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TagCreator from '@/components/TagCreator';
import { categoryColors } from '@/constants/Colors';

export default function TasksScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = useTodoStore((state) => state.isDarkMode);
  const colors = Colors[isDarkMode ? 'dark' : 'light'];
  
  const tasks = useTodoStore((state) => state.tasks);
  const customTags = useTodoStore((state) => state.customTags);
  const addTask = useTodoStore((state) => state.addTask);
  const updateTask = useTodoStore((state) => state.updateTask);
  const toggleTaskStatus = useTodoStore((state) => state.toggleTaskStatus);
  const deleteTask = useTodoStore((state) => state.deleteTask);
  
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [isTagCreatorVisible, setIsTagCreatorVisible] = useState(false);
  // Track collapsed categories
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  // Track if the completed section is collapsed
  const [isCompletedCollapsed, setIsCompletedCollapsed] = useState(false);
  
  // Log tasks when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Обновить состояние из AsyncStorage при фокусе экрана
      const refreshTasksFromStorage = async () => {
        try {
          const storedTasks = await AsyncStorage.getItem('@todo_app_tasks');
          if (storedTasks) {
            const parsedTasks = JSON.parse(storedTasks);
            
            // Всегда обновляем состояние из AsyncStorage при фокусе экрана
            useTodoStore.setState({ tasks: parsedTasks });
          }
        } catch (error) {
          // Тихо обрабатываем ошибку без логов
        }
      };
      
      refreshTasksFromStorage();
      
      // Установим таймер для периодического обновления задач с экрана
      const intervalId = setInterval(refreshTasksFromStorage, 2000);
      
      return () => {
        clearInterval(intervalId);
      };
    }, [])  // Убрали зависимость от tasks, чтобы не вызывало рекурсивное обновление
  );
  
  // Handle toggling category collapse state
  const toggleCategoryCollapse = (category: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Handle toggling completed section collapse state
  const toggleCompletedCollapse = () => {
    setIsCompletedCollapsed(!isCompletedCollapsed);
  };
  
  // Group tasks by categories
  const groupedTasks = useMemo(() => {
    // Filter tasks to only include incomplete tasks due today or in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for proper comparison
    
    // Filter out future tasks and completed tasks
    const filteredTasks = tasks.filter(task => {
      if (task.completed) return false; // Remove completed tasks
      if (!task.dueDate) return true; // Tasks with no due date are shown on main screen
      
      const taskDueDate = new Date(task.dueDate);
      taskDueDate.setHours(0, 0, 0, 0); // Set to start of day
      
      // Only include tasks due today or in the past
      return taskDueDate <= today;
    });
    
    // Get all categories from the tasks
    const categories = new Set<string>();
    filteredTasks.forEach(task => {
      if (task.category) {
        categories.add(task.category);
      }
    });
    
    // Add all category names from the categoryColors object
    Object.keys(categoryColors).forEach(category => {
      categories.add(category);
    });
    
    // Create sections for each category
    const sections = Array.from(categories).map(category => {
      // Filter tasks by this category
      const tasksInCategory = filteredTasks.filter(task => task.category === category);
      
      return {
        title: category,
        data: tasksInCategory,
        collapsed: collapsedCategories[category] || false
      };
    });
    
    // Add uncategorized tasks section
    const uncategorizedTasks = filteredTasks.filter(task => !task.category);
    if (uncategorizedTasks.length > 0) {
      sections.push({
        title: 'Uncategorized',
        data: uncategorizedTasks,
        collapsed: collapsedCategories['Uncategorized'] || false
      });
    }
    
    // Only return sections that have tasks
    return sections.filter(section => section.data.length > 0);
  }, [tasks, collapsedCategories]);

  // Group completed tasks in their own section
  const completedTasks = useMemo(() => {
    // Filter to only include completed tasks
    const filtered = tasks.filter(task => task.completed);
    
    if (filtered.length === 0) {
      return [];
    }
    
    return [{
      title: 'Completed',
      data: filtered,
      collapsed: isCompletedCollapsed
    }];
  }, [tasks, isCompletedCollapsed]);

  // Combine all sections
  const allSections = useMemo(() => {
    return [...groupedTasks, ...completedTasks];
  }, [groupedTasks, completedTasks]);
  
  const handleAddTask = () => {
    setSelectedTask(undefined);
    setIsFormVisible(true);
  };
  
  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsFormVisible(true);
  };
  
  const handleTaskPress = (task: Task) => {
    router.push({
      pathname: '/task-details',
      params: { id: task.id }
    });
  };
  
  const handleSubmitTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    // Make sure we have a due date (default to current date if none provided)
    const taskWithDate = {
      ...task,
      dueDate: task.dueDate || new Date().toISOString()
    };
    
    if (selectedTask) {
      updateTask({ ...selectedTask, ...taskWithDate });
    } else {
      addTask(taskWithDate);
    }
    
    setIsFormVisible(false);
  };
  
  // Custom handler for task completion to auto-move tasks
  const handleToggleComplete = (taskId: string) => {
    toggleTaskStatus(taskId);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      {/* Header with title */}
      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>today</Text>
      </View>
      
      {/* Tasks list or empty state */}
      {allSections.length === 0 ? (
        <EmptyState message="No tasks found. Add a new task!" />
      ) : (
        <SectionList
          sections={allSections}
          keyExtractor={(item) => item.id}
          renderItem={({ item, section }) => {
            // Only render items if the section is not collapsed
            if (section.collapsed) return null;
            return (
              <TaskItem
                task={item}
                onToggleComplete={handleToggleComplete}
                onDelete={deleteTask}
                onPress={handleTaskPress}
                onEdit={handleEditTask}
              />
            );
          }}
          renderSectionHeader={({ section }) => {
            const isCompletedSection = section.title === 'Completed';
            const borderColor = isCompletedSection
              ? colors.success
              : categoryColors[section.title as keyof typeof categoryColors] || colors.gray;
                  
            return (
              <TouchableOpacity
                style={[
                  styles.sectionHeader, 
                  { 
                    backgroundColor: colors.background,
                    borderLeftWidth: 4,
                    borderLeftColor: borderColor
                  }
                ]}
                onPress={() => {
                  isCompletedSection 
                    ? toggleCompletedCollapse() 
                    : toggleCategoryCollapse(section.title);
                }}
              >
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {section.title}
                </Text>
                <View style={styles.sectionHeaderRight}>
                  <Text style={[styles.taskCount, { color: colors.secondaryText }]}>
                    {section.data.length}
                  </Text>
                  <MaterialIcons 
                    name={section.collapsed ? 'keyboard-arrow-down' : 'keyboard-arrow-up'} 
                    size={18} 
                    color={colors.secondaryText} 
                  />
                </View>
              </TouchableOpacity>
            );
          }}
          stickySectionHeadersEnabled={true}
          contentContainerStyle={styles.listContent}
        />
      )}
      
      {/* Floating Add Button */}
      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: colors.primary }]}
        onPress={handleAddTask}
      >
        <MaterialIcons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
      
      <CapsuleMenu />
      
      <TaskForm
        visible={isFormVisible}
        onClose={() => setIsFormVisible(false)}
        onSubmit={handleSubmitTask}
        initialTask={selectedTask}
      />
      
      <TagCreator
        visible={isTagCreatorVisible}
        onClose={() => setIsTagCreatorVisible(false)}
        onSelect={(tag) => setIsTagCreatorVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '600',
  },
  sectionHeader: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 8,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskCount: {
    fontSize: 12,
    marginRight: 4,
  },
  listContent: {
    paddingBottom: 100,
    paddingTop: 8,
  },
  floatingButton: {
    position: 'absolute',
    right: 24,
    bottom: 110,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
