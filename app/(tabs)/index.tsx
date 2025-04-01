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
  
  // Log tasks when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Tasks screen focused, tasks count:', tasks.length);
      
      // Обновить состояние из AsyncStorage при фокусе экрана
      const refreshTasksFromStorage = async () => {
        try {
          console.log('Refreshing tasks from AsyncStorage...');
          const storedTasks = await AsyncStorage.getItem('@todo_app_tasks');
          if (storedTasks) {
            const parsedTasks = JSON.parse(storedTasks);
            console.log(`Refreshed ${parsedTasks.length} tasks from storage`);
            
            // Всегда обновляем состояние из AsyncStorage при фокусе экрана
            useTodoStore.setState({ tasks: parsedTasks });
          }
        } catch (error) {
          console.error('Error refreshing tasks from storage:', error);
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
  
  // Group tasks by categories
  const groupedTasks = useMemo(() => {
    // Get all categories from the tasks
    const categories = new Set<string>();
    tasks.forEach(task => {
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
      const tasksInCategory = tasks.filter(task => task.category === category);
      
      return {
        title: category,
        data: tasksInCategory
      };
    });
    
    // Add uncategorized tasks section
    const uncategorizedTasks = tasks.filter(task => !task.category);
    if (uncategorizedTasks.length > 0) {
      sections.push({
        title: 'Uncategorized',
        data: uncategorizedTasks
      });
    }
    
    // Only return sections that have tasks
    return sections.filter(section => section.data.length > 0);
  }, [tasks]);
  
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      {/* Header with title */}
      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>today</Text>
      </View>
      
      {/* Tasks list or empty state */}
      {groupedTasks.length === 0 ? (
        <EmptyState message="No tasks found. Add a new task!" />
      ) : (
        <SectionList
          sections={groupedTasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskItem
              task={item}
              onToggleComplete={toggleTaskStatus}
              onDelete={deleteTask}
              onPress={handleTaskPress}
              onEdit={handleEditTask}
            />
          )}
          renderSectionHeader={({ section: { title } }) => (
            <View style={[
              styles.sectionHeader, 
              { 
                backgroundColor: colors.background,
                borderLeftWidth: 4,
                borderLeftColor: categoryColors[title as keyof typeof categoryColors] || colors.gray
              }
            ]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
            </View>
          )}
          stickySectionHeadersEnabled={true}
          contentContainerStyle={styles.listContent}
        />
      )}
      
      <CapsuleMenu onAddPress={handleAddTask} />
      
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
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 8,
  },
  listContent: {
    paddingBottom: 100,
    paddingTop: 8,
  },
});
