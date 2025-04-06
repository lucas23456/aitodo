import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, SectionList, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { format, isToday, isTomorrow, addDays, startOfDay, isSameDay } from 'date-fns';
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
import DateSlider from '@/components/DateSlider';
import CalendarModal from '@/components/CalendarModal';

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
  
  // Date slider related state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  
  // Generate 14 dates starting from today for the slider
  const dates = useMemo(() => {
    const result = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      result.push(addDays(today, i));
    }
    return result;
  }, []);
  
  // Handle date from URL params on navigation using useLocalSearchParams
  const params = useLocalSearchParams();
  const dateParam = params.date as string | undefined;
  
  // Check for date parameter when the screen comes into focus - only once
  useEffect(() => {
    if (dateParam) {
      try {
        const date = new Date(dateParam);
        if (!isNaN(date.getTime())) {  // Check if date is valid
          setSelectedDate(date);
        }
      } catch (error) {
        console.error('Invalid date parameter', error);
      }
    }
  }, [dateParam]);
  
  // Log tasks when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      
      const refreshTasksFromStorage = async () => {
        if (!isMounted) return;
        
        try {
          const storedTasks = await AsyncStorage.getItem('@todo_app_tasks');
          if (storedTasks && isMounted) {
            const parsedTasks = JSON.parse(storedTasks);
            // Use a ref to track if we need to update to avoid re-renders during render
            const currentTasksJSON = JSON.stringify(tasks);
            const newTasksJSON = JSON.stringify(parsedTasks);
            
            if (currentTasksJSON !== newTasksJSON) {
              // Use setState directly but don't trigger a re-render of this component
              useTodoStore.setState({ tasks: parsedTasks }, false);
            }
          }
        } catch (error) {
          // Silently handle errors
        }
      };
      
      // Run once when screen comes into focus
      refreshTasksFromStorage();
      
      return () => {
        isMounted = false;
      };
    }, []) // Empty dependency array - we'll manage tasks comparison internally
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
    // Filter tasks to only include incomplete tasks due on selected date
    const selectedDay = startOfDay(selectedDate);
    
    // Filter out future tasks and completed tasks
    const filteredTasks = tasks.filter(task => {
      if (task.completed) return false; // Remove completed tasks
      if (!task.dueDate) return true; // Tasks with no due date are shown on main screen
      
      const taskDueDate = new Date(task.dueDate);
      taskDueDate.setHours(0, 0, 0, 0); // Set to start of day
      
      // Show tasks for the selected date (if today, also include overdue tasks)
      if (isToday(selectedDate)) {
        return taskDueDate <= selectedDay;
      } else {
        return isSameDay(taskDueDate, selectedDay);
      }
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
  }, [tasks, collapsedCategories, selectedDate]);

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
    // Make sure we have a due date (using selected date if none provided)
    const taskWithDate = {
      ...task,
      dueDate: task.dueDate || selectedDate.toISOString()
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

  // Format date for the header
  const formatHeaderDate = (date: Date) => {
    if (isToday(date)) return "today";
    if (isTomorrow(date)) return "tomorrow";
    
    return format(date, 'EEEE, MMM d').toLowerCase();
  };
  
  // Handle date selection from date slider
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };
  
  // Handle calendar button press
  const handleCalendarPress = () => {
    setIsCalendarVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      {/* Header with title and calendar button */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTitleWrapper}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{formatHeaderDate(selectedDate)}</Text>
          <TouchableOpacity 
            style={[styles.calendarButton, { backgroundColor: colors.card }]}
            onPress={handleCalendarPress}
          >
            <MaterialIcons name="calendar-today" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Date Slider */}
      <View style={styles.dateSliderContainer}>
        <DateSlider
          dates={dates}
          selectedDate={selectedDate}
          onSelectDate={handleDateSelect}
        />
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
      
      {/* Calendar Modal */}
      <CalendarModal
        visible={isCalendarVisible}
        onClose={() => setIsCalendarVisible(false)}
        selectedDate={selectedDate}
        onSelectDate={handleDateSelect}
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
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '600',
  },
  dateSliderContainer: {
    marginBottom: 10,
  },
  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
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
