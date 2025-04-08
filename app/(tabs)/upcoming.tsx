import React, { useState, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  SectionList,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { format, isToday, isTomorrow, addDays, startOfDay, isSameDay, differenceInDays } from 'date-fns';
import { MaterialIcons } from '@expo/vector-icons';
import { useTodoStore, Task } from '@/store/todoStore';
import TaskItem from '@/components/TaskItem';
import DateSlider from '@/components/DateSlider';
import CalendarModal from '@/components/CalendarModal';
import EmptyState from '@/components/EmptyState';
import CapsuleMenu from '@/components/CapsuleMenu';
import Colors from '@/constants/Colors';
import TaskForm from '@/components/TaskForm';

export default function UpcomingScreen() {
  const isDarkMode = useTodoStore((state) => state.isDarkMode);
  const colors = Colors[isDarkMode ? 'dark' : 'light'];
  
  const tasks = useTodoStore((state) => state.tasks);
  const toggleTaskStatus = useTodoStore((state) => state.toggleTaskStatus);
  const deleteTask = useTodoStore((state) => state.deleteTask);
  const addTask = useTodoStore((state) => state.addTask);
  const updateTask = useTodoStore((state) => state.updateTask);
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  
  // Generate 14 dates starting from today for the slider
  const dates = useMemo(() => {
    const result = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      result.push(addDays(today, i));
    }
    return result;
  }, []);
  
  // Filter tasks for the selected date
  const filteredTasks = useMemo(() => {
    const selectedDateStart = startOfDay(selectedDate);
    const today = startOfDay(new Date());
    
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      
      const taskDueDate = startOfDay(new Date(task.dueDate));
      
      // Direct date match - task is directly scheduled for the selected date
      if (isSameDay(taskDueDate, selectedDateStart)) {
        return true;
      }
      
      // Handle repeating tasks
      if (task.repeat && task.repeat.type !== 'none') {
        // Only process repeating tasks if their original due date is on or before the selected date
        if (taskDueDate > selectedDateStart) {
          return false;
        }
        
        // Check if we've passed the end date (if one exists)
        if (task.repeat.endDate && new Date(task.repeat.endDate) < selectedDateStart) {
          return false;
        }
        
        const daysSinceOriginal = differenceInDays(selectedDateStart, taskDueDate);
        if (daysSinceOriginal < 0) return false; // Selected date is before the original due date
        
        const { type, interval } = task.repeat;
        
        switch (type) {
          case 'daily':
            // Check if the days since the original date is divisible by the interval
            return daysSinceOriginal % interval === 0;
            
          case 'weekly':
            // For weekly, check if the number of weeks (days/7) is divisible by the interval
            return Math.floor(daysSinceOriginal / 7) % interval === 0 && 
                   taskDueDate.getDay() === selectedDateStart.getDay();
            
          case 'monthly':
            // For monthly, check if months match based on day of month
            const monthDiff = 
              (selectedDateStart.getFullYear() - taskDueDate.getFullYear()) * 12 + 
              (selectedDateStart.getMonth() - taskDueDate.getMonth());
            
            // Only show if the month difference is divisible by the interval
            // AND we're on the same day of month (or closest valid day if original day doesn't exist in this month)
            return monthDiff % interval === 0 && 
                   selectedDateStart.getDate() === Math.min(
                     taskDueDate.getDate(), 
                     new Date(
                       selectedDateStart.getFullYear(), 
                       selectedDateStart.getMonth() + 1, 
                       0
                     ).getDate() // Last day of the selected month
                   );
            
          default:
            return false;
        }
      }
      
      // For non-repeating tasks, only return direct date matches
      return false;
    });
  }, [tasks, selectedDate]);
  
  // Check if a task is repeating on the selected date (not just its original date)
  const isRepeating = (task: Task): boolean => {
    if (!task.repeat || task.repeat.type === 'none') return false;
    
    // If the task's original due date matches the selected date, it's not considered a "repeating occurrence"
    if (task.dueDate) {
      const taskDueDate = startOfDay(new Date(task.dueDate));
      if (isSameDay(taskDueDate, startOfDay(selectedDate))) {
        return false;
      }
    }
    
    return true;
  };
  
  // Prepare section list data
  const sectionListData = useMemo(() => {
    // Separate tasks into original, repeating, and completed
    const originalTasks = filteredTasks.filter(task => !task.completed && !isRepeating(task));
    const repeatingTasks = filteredTasks.filter(task => !task.completed && isRepeating(task));
    const completedTasks = filteredTasks.filter(task => task.completed);
    
    const sections = [];
    
    // Add original tasks section if not empty
    if (originalTasks.length > 0) {
      sections.push({
        title: 'Tasks',
        data: originalTasks
      });
    }
    
    // Add repeating tasks section if not empty
    if (repeatingTasks.length > 0) {
      sections.push({
        title: 'Repeating',
        data: repeatingTasks
      });
    }
    
    // Add completed tasks section if not empty
    if (completedTasks.length > 0) {
      sections.push({
        title: 'Completed',
        data: completedTasks
      });
    }
    
    return sections;
  }, [filteredTasks, selectedDate]);
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };
  
  const handleCalendarPress = () => {
    setIsCalendarVisible(true);
  };
  
  const handleTaskPress = (task: Task) => {
    router.push({
      pathname: '/task-details',
      params: { id: task.id }
    });
  };
  
  const handleAddTask = () => {
    setSelectedTask(undefined);
    setIsFormVisible(true);
  };
  
  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsFormVisible(true);
  };
  
  const handleSubmitTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    // Make sure we have the selected date as due date
    const taskWithDate = {
      ...task,
      dueDate: selectedDate.toISOString()
    };
    
    if (selectedTask) {
      // Update existing task
      updateTask({ ...selectedTask, ...taskWithDate });
    } else {
      // Add new task
      addTask(taskWithDate);
    }
    
    setIsFormVisible(false);
  };
  
  // Format date for the header
  const formatHeaderDate = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    
    return format(date, 'EEEE, MMM d');
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>upcoming</Text>
          <View style={styles.headerButtonsContainer}>
            <TouchableOpacity 
              style={[styles.calendarButton, { backgroundColor: colors.card }]}
              onPress={handleCalendarPress}
            >
              <MaterialIcons name="calendar-today" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.selectedDate, { color: colors.secondaryText }]}>
          {formatHeaderDate(selectedDate)}
        </Text>
      </View>
      
      {/* Date Slider */}
      <View style={styles.dateSliderContainer}>
        <DateSlider
          dates={dates}
          selectedDate={selectedDate}
          onSelectDate={handleDateSelect}
        />
      </View>
      
      {/* Task List or Empty State */}
      {sectionListData.length === 0 ? (
        <EmptyState message="No tasks scheduled for this day" />
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
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
            </View>
          )}
          contentContainerStyle={styles.taskList}
        />
      )}
      
      {/* Floating Add Button */}
      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: colors.primary }]}
        onPress={handleAddTask}
      >
        <MaterialIcons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
      
      <CalendarModal
        visible={isCalendarVisible}
        onClose={() => setIsCalendarVisible(false)}
        selectedDate={new Date()}
        onSelectDate={(date) => {
          setIsCalendarVisible(false);
          
          setTimeout(() => {
            router.push({
              pathname: '/(tabs)',
              params: { date: date.toISOString() }
            });
          }, 100);
        }}
      />
      
      <TaskForm
        visible={isFormVisible}
        onClose={() => setIsFormVisible(false)}
        onSubmit={handleSubmitTask}
        initialTask={selectedTask}
      />
      
      <CapsuleMenu />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 25,
    paddingBottom: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDate: {
    fontSize: 18,
    fontWeight: '500',
  },
  dateSliderContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  taskList: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Space for capsule menu
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