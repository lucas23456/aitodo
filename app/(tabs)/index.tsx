import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, SectionList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { format, isToday, isSameDay, startOfDay } from 'date-fns';
import { useTodoStore, Task } from '@/store/todoStore';
import { useColorScheme } from '@/components/useColorScheme';
import TaskItem from '@/components/TaskItem';
import TaskForm from '@/components/TaskForm';
import EmptyState from '@/components/EmptyState';
import CapsuleMenu from '@/components/CapsuleMenu';
import Colors from '@/constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TasksScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = useTodoStore((state) => state.isDarkMode);
  const colors = Colors[isDarkMode ? 'dark' : 'light'];
  
  const tasks = useTodoStore((state) => state.tasks);
  const addTask = useTodoStore((state) => state.addTask);
  const updateTask = useTodoStore((state) => state.updateTask);
  const toggleTaskStatus = useTodoStore((state) => state.toggleTaskStatus);
  const deleteTask = useTodoStore((state) => state.deleteTask);
  
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  
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
  
  // Filter and sort tasks by date and completion status
  const filteredAndSortedTasks = useMemo(() => {
    // Get today's date
    const today = startOfDay(new Date());
    console.log('Today is:', today.toISOString());
    
    // Filter tasks for today
    const todaysTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      
      const taskDate = startOfDay(new Date(task.dueDate));
      const isTaskToday = isSameDay(taskDate, today);
      
      // Отладочная информация для отслеживания проблем с отображением задач
      if (isTaskToday) {
        console.log(`Task "${task.title}" IS for today, date: ${taskDate.toISOString()}`);
      } else {
        console.log(`Task "${task.title}" is NOT for today, date: ${taskDate.toISOString()}`);
      }
      
      return isTaskToday;
    });
    
    console.log('Total today tasks found:', todaysTasks.length);
    
    // Group tasks by completion status
    const incompleteTasks = todaysTasks.filter(task => !task.completed);
    const completedTasks = todaysTasks.filter(task => task.completed);
    
    return {
      incomplete: incompleteTasks,
      completed: completedTasks
    };
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
  
  // Prepare data for the Section List for today's tasks
  const sectionListData = [
    {
      title: 'Tasks',
      data: filteredAndSortedTasks.incomplete
    },
    {
      title: 'Completed',
      data: filteredAndSortedTasks.completed
    }
  ].filter(section => section.data.length > 0);
  
  // Check if there are no tasks for today
  const noTasksForToday = sectionListData.every(section => section.data.length === 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      {/* Header with today title and task count */}
      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>today</Text>
      </View>
      
      {/* Tasks list or empty state */}
      {noTasksForToday ? (
        <EmptyState message="No tasks for today. Add a new task!" />
      ) : (
        <SectionList
          sections={sectionListData}
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
            <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
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
  taskCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  countText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeProgressContainer: {
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timeProgressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionHeader: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  listContent: {
    paddingBottom: 100,
    paddingTop: 8,
  },
  emptyDateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyDateText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  taskItemContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskContentContainer: {
    flex: 1,
  },
  companyPrefix: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 14,
  },
  taskTimeContainer: {
    marginLeft: 12,
  },
  taskTime: {
    fontSize: 12,
  },
});
