import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, SectionList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { format, isToday, isSameDay, startOfDay } from 'date-fns';
import { useTodoStore, Task } from '@/store/todoStore';
import { useColorScheme } from '@/components/useColorScheme';
import TaskItem from '@/components/TaskItem';
import TaskForm from '@/components/TaskForm';
import EmptyState from '@/components/EmptyState';
import DateSlider from '@/components/DateSlider';
import CalendarModal from '@/components/CalendarModal';
import CapsuleMenu from '@/components/CapsuleMenu';
import Colors from '@/constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';

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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  
  // Sample data for project prefixes
  const companySamples = ['@coinbase:', '@apple:', '@shopify:', '@insurance:'];
  
  // Filter and sort tasks by date and completion status
  const filteredAndSortedTasks = useMemo(() => {
    // For date filtering, convert selectedDate to start of day for comparison
    const selectedDateStart = startOfDay(selectedDate);
    
    // Filter tasks for the selected date
    const tasksForSelectedDate = tasks.filter(task => {
      if (!task.dueDate) return false;
      
      const taskDate = startOfDay(new Date(task.dueDate));
      return isSameDay(taskDate, selectedDateStart);
    });
    
    // Group tasks by time of day - if no real tasks, use sample data
    let morningTasks = tasksForSelectedDate.filter(task => !task.completed).slice(0, 3);
    let afternoonTasks = tasksForSelectedDate.filter(task => !task.completed).slice(3, 6);
    let eveningTasks = tasksForSelectedDate.filter(task => !task.completed).slice(6, 9);
    
    // If we don't have actual tasks, create sample data
    if (tasksForSelectedDate.length === 0) {
      // Morning samples
      morningTasks = [
        {
          id: 'm1',
          title: 'design user registration process',
          description: '',
          dueDate: new Date().toISOString(),
          completed: false,
          createdAt: new Date().toISOString(),
          category: 'Work',
          tags: ['Design'],
          priority: 'high',
          estimatedTime: '50 min',
          company: '@coinbase'
        },
        {
          id: 'm2',
          title: 'review and provide feedback on the wireframes for the new design concept',
          description: '',
          dueDate: new Date().toISOString(),
          completed: false,
          createdAt: new Date().toISOString(),
          category: 'Design',
          tags: ['Feedback'],
          priority: 'medium',
          estimatedTime: '45 min',
          company: '@apple'
        },
        {
          id: 'm3',
          title: 'mood board for the ecommerce template',
          description: '',
          dueDate: new Date().toISOString(),
          completed: false,
          createdAt: new Date().toISOString(),
          category: 'Design',
          tags: ['Moodboard'],
          priority: 'low',
          estimatedTime: '30 min',
          company: '@shopify'
        }
      ] as Task[];
      
      // Afternoon samples
      afternoonTasks = [
        {
          id: 'a1',
          title: 'finalize color palette and typography',
          description: '',
          dueDate: new Date().toISOString(),
          completed: false,
          createdAt: new Date().toISOString(),
          category: 'Design',
          tags: ['Color'],
          priority: 'medium',
          estimatedTime: '25 min',
          company: '@apple'
        },
        {
          id: 'a2',
          title: 'analyze user feedback and suggest improvements',
          description: '',
          dueDate: new Date().toISOString(),
          completed: false,
          createdAt: new Date().toISOString(),
          category: 'Research',
          tags: ['Feedback'],
          priority: 'high',
          estimatedTime: '60 min',
          company: '@insurance'
        },
        {
          id: 'a3',
          title: 'evaluate two potential website layouts',
          description: '',
          dueDate: new Date().toISOString(),
          completed: false,
          createdAt: new Date().toISOString(),
          category: 'Design',
          tags: ['Layout'],
          priority: 'medium', 
          estimatedTime: '45 min',
          company: '@shopify'
        }
      ] as Task[];
      
      // Evening samples
      eveningTasks = [
        {
          id: 'e1',
          title: 'identity project',
          description: '',
          dueDate: new Date().toISOString(),
          completed: false,
          createdAt: new Date().toISOString(),
          category: 'Design',
          tags: ['Identity'],
          priority: 'medium',
          estimatedTime: '45 min',
          company: '@coinbase'
        }
      ] as Task[];
    }
    
    const completedTasks = tasksForSelectedDate.filter(task => task.completed);
    
    // Sort by priority
    const sortByPriority = (a: Task, b: Task) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityA = priorityOrder[a.priority] || 1;
      const priorityB = priorityOrder[b.priority] || 1;
      return priorityA - priorityB;
    };
    
    return {
      morning: [...morningTasks].sort(sortByPriority),
      afternoon: [...afternoonTasks].sort(sortByPriority),
      evening: [...eveningTasks].sort(sortByPriority),
      completed: [...completedTasks]
    };
  }, [tasks, selectedDate]);
  
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
    if (selectedTask) {
      updateTask({ ...selectedTask, ...task });
    } else {
      addTask(task);
    }
  };
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };
  
  const handleCalendarPress = () => {
    setIsCalendarVisible(true);
  };
  
  // Prepare data for the Section List when viewing by date
  const sectionListData = [
    {
      title: 'Morning',
      data: filteredAndSortedTasks.morning
    },
    {
      title: 'Afternoon',
      data: filteredAndSortedTasks.afternoon
    },
    {
      title: 'Evening',
      data: filteredAndSortedTasks.evening
    },
    {
      title: 'Completed',
      data: filteredAndSortedTasks.completed
    }
  ].filter(section => section.data.length > 0); // Only show sections with tasks
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      {/* Header with today title and task count */}
      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>today</Text>
        
        <View style={styles.taskCountContainer}>
          <View style={[styles.countBadge, { backgroundColor: colors.card }]}>
            <Text style={[styles.countText, { color: colors.text }]}>
              {tasks.filter(t => !t.completed).length}
            </Text>
          </View>
          
          <View style={[styles.timeProgressContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.timeProgressText, { color: colors.text }]}>
              1.5 of 7.5 hrs
            </Text>
          </View>
        </View>
      </View>
      
      {/* Date Navigation */}
      <DateSlider 
        selectedDate={selectedDate}
        onSelectDate={handleDateSelect}
        onPressHeader={handleCalendarPress}
      />
      
      {/* Task List */}
      {tasks.length === 0 && sectionListData.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {sectionListData.length === 0 ? (
            <View style={styles.emptyDateContainer}>
              <Text style={[styles.emptyDateText, { color: colors.gray }]}>
                No tasks scheduled for this date
              </Text>
            </View>
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
                />
              )}
              renderSectionHeader={({ section: { title } }) => (
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIcon}>
                    <Text style={[styles.sectionIconText, { color: colors.secondaryText }]}>
                      {title === 'Morning' ? '☀️' : title === 'Afternoon' ? '🌤️' : '🌙'}
                    </Text>
                  </View>
                  <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>{title}</Text>
                </View>
              )}
              contentContainerStyle={styles.listContent}
              stickySectionHeadersEnabled={false}
            />
          )}
        </>
      )}
      
      <CapsuleMenu onAddPress={handleAddTask} />
      
      <TaskForm
        visible={isFormVisible}
        onClose={() => setIsFormVisible(false)}
        onSubmit={handleSubmitTask}
        initialTask={selectedTask}
      />
      
      <CalendarModal
        visible={isCalendarVisible}
        onClose={() => setIsCalendarVisible(false)}
        selectedDate={selectedDate}
        onSelectDate={handleDateSelect}
        markedDates={{}}
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
    paddingBottom: 4,
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
  sectionIcon: {
    marginRight: 8,
  },
  sectionIconText: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  listContent: {
    paddingBottom: 100,
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
