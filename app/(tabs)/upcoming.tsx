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

export default function UpcomingScreen() {
  const isDarkMode = useTodoStore((state) => state.isDarkMode);
  const colors = Colors[isDarkMode ? 'dark' : 'light'];
  
  const tasks = useTodoStore((state) => state.tasks);
  const toggleTaskStatus = useTodoStore((state) => state.toggleTaskStatus);
  const deleteTask = useTodoStore((state) => state.deleteTask);
  
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
  
  // Filter tasks for the selected date
  const filteredTasks = useMemo(() => {
    const selectedDateStart = startOfDay(selectedDate);
    
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      
      const taskDate = startOfDay(new Date(task.dueDate));
      return isSameDay(taskDate, selectedDateStart);
    });
  }, [tasks, selectedDate]);
  
  // Group tasks by completion status
  const groupedTasks = useMemo(() => {
    const completed = filteredTasks.filter(task => task.completed);
    const incomplete = filteredTasks.filter(task => !task.completed);
    
    // Sort incomplete tasks by priority
    const sortByPriority = (a: Task, b: Task) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
    };
    
    return {
      incomplete: incomplete.sort(sortByPriority),
      completed: completed
    };
  }, [filteredTasks]);
  
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
  
  // Format date for the header
  const formatHeaderDate = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    
    return format(date, 'EEEE, MMM d');
  };
  
  // Prepare section list data
  const sectionListData = [
    {
      title: 'Tasks',
      data: groupedTasks.incomplete
    },
    {
      title: 'Completed',
      data: groupedTasks.completed
    }
  ].filter(section => section.data.length > 0);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Upcoming</Text>
          <TouchableOpacity 
            style={[styles.calendarButton, { backgroundColor: colors.card }]}
            onPress={handleCalendarPress}
          >
            <MaterialIcons name="calendar-today" size={22} color={colors.text} />
          </TouchableOpacity>
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
      
      <CalendarModal
        visible={isCalendarVisible}
        onClose={() => setIsCalendarVisible(false)}
        onSelectDate={handleDateSelect}
        selectedDate={selectedDate}
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
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
}); 