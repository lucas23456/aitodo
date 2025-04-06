import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { addDays, format, isToday, isSameDay, startOfWeek, startOfDay } from 'date-fns';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import { useTodoStore } from '@/store/todoStore';

type DateSliderProps = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onPressHeader?: () => void;
  dates?: Date[];
};

export default function DateSlider({ selectedDate, onSelectDate, onPressHeader, dates: propDates }: DateSliderProps) {
  const colorScheme = useColorScheme();
  const isDarkMode = useTodoStore((state) => state.isDarkMode);
  const colors = Colors[isDarkMode ? 'dark' : 'light'];
  const tasks = useTodoStore((state) => state.tasks);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today);
  const [dates, setDates] = useState<Date[]>([]);
  
  // Generate array of dates for the week if not provided via props
  useEffect(() => {
    if (propDates && propDates.length > 0) {
      setDates(propDates);
    } else {
      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        weekDates.push(addDays(startOfCurrentWeek, i));
      }
      setDates(weekDates);
    }
  }, [propDates]);
  
  // Scroll to selected date when component mounts or selected date changes
  useEffect(() => {
    if (scrollViewRef.current && dates.length > 0) {
      // Find the index of the selected date
      const selectedIndex = dates.findIndex(date => isSameDay(date, selectedDate));
      
      if (selectedIndex !== -1) {
        // Calculate the scroll position (48 is the width of date item, 6 is the margin)
        const scrollTo = selectedIndex * (48 + 12); // width + margins
        
        // Add a small delay to ensure the ScrollView has rendered
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ x: scrollTo, animated: true });
        }, 100);
      }
    }
  }, [selectedDate, dates]);
  
  // Format day name (Mon, Tue, etc)
  const formatDayName = (date: Date) => {
    return format(date, 'EEE').toLowerCase();
  };
  
  // Format day number
  const formatDayNumber = (date: Date) => {
    return format(date, 'd');
  };
  
  // Check if a date has tasks
  const hasTasksForDate = (date: Date) => {
    // Start of the day for comparison
    const dayStart = startOfDay(date);
    
    // Check if any task's due date matches this date
    return tasks.some(task => {
      if (!task.dueDate) return false;
      const taskDate = startOfDay(new Date(task.dueDate));
      return isSameDay(taskDate, dayStart);
    });
  };
  
  // Get task count for a date
  const getTaskCountForDate = (date: Date): number => {
    // Start of the day for comparison
    const dayStart = startOfDay(date);
    
    // Count tasks that match this date
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = startOfDay(new Date(task.dueDate));
      return isSameDay(taskDate, dayStart);
    }).length;
  };
  
  return (
    <View style={styles.container}>
      {/* Days of week row */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {dates.map((date, index) => {
          const taskCount = getTaskCountForDate(date);
          const hasTasks = taskCount > 0;
          const isSelected = isSameDay(date, selectedDate);
          const isToday_ = isToday(date);
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateItem,
                isToday_ && [
                  styles.todayItem, 
                  { 
                    borderColor: isDarkMode ? 'rgba(125, 187, 245, 0.4)' : 'rgba(0,0,0,0.1)',
                    backgroundColor: isDarkMode && !isSelected ? 'rgba(125, 187, 245, 0.1)' : undefined
                  }
                ],
                isSelected && [
                  styles.selectedDateItem, 
                  { 
                    backgroundColor: isDarkMode ? 'rgba(125, 187, 245, 0.2)' : colors.card,
                    borderColor: isDarkMode ? colors.primary : undefined,
                    borderWidth: isDarkMode ? 1 : undefined
                  }
                ]
              ]}
              onPress={() => onSelectDate(date)}
            >
              <Text
                style={[
                  styles.dayName,
                  { color: colors.secondaryText },
                  isToday_ && [styles.todayText, { color: colors.primary }],
                  isSelected && { color: colors.primary }
                ]}
              >
                {formatDayName(date)}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  { color: colors.text },
                  isToday_ && [styles.todayNumber, { color: colors.primary }],
                  isSelected && { color: colors.primary, fontWeight: '600' },
                  hasTasks && styles.hasTasksDayNumber
                ]}
              >
                {formatDayNumber(date)}
              </Text>
              
              {/* Task indicator container */}
              {hasTasks && (
                <View style={styles.indicatorContainer}>
                  {/* For 1-3 tasks, show individual dots */}
                  {taskCount <= 3 ? (
                    [...Array(taskCount)].map((_, i) => (
                      <View 
                        key={i}
                        style={[
                          styles.taskIndicator,
                          { 
                            backgroundColor: isSelected 
                              ? colors.primary 
                              : isToday_ 
                                ? colors.primary
                                : isDarkMode ? colors.success : colors.success,
                            marginLeft: i > 0 ? 3 : 0,
                            opacity: isDarkMode ? 0.9 : 0.8
                          }
                        ]} 
                      />
                    ))
                  ) : (
                    // For 4+ tasks, show a small pill with the number
                    <View style={[
                      styles.multiTaskIndicator,
                      { 
                        backgroundColor: isSelected 
                          ? colors.primary 
                          : isToday_
                            ? colors.primary
                            : isDarkMode ? colors.warning : colors.warning,
                        opacity: isDarkMode ? 0.95 : 0.9
                      }
                    ]}>
                      <Text style={[
                        styles.multiTaskText,
                        { color: isDarkMode ? '#000' : '#FFF' }
                      ]}>
                        {taskCount > 9 ? '9+' : taskCount}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  dateItem: {
    width: 48, // Slightly wider to accommodate the indicators
    height: 70, // Slightly taller to accommodate the indicators
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6, // Slightly reduced to fit more dates
    borderRadius: 20,
    position: 'relative',
  },
  selectedDateItem: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  todayItem: {
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  dayName: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'lowercase',
  },
  todayText: {
    fontWeight: '500',
  },
  dayNumber: {
    fontSize: 16,
    marginBottom: 8, // More space for indicators
  },
  todayNumber: {
    fontWeight: '600',
  },
  hasTasksDayNumber: {
    fontWeight: '500', // Make days with tasks slightly bolder
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 8,
  },
  taskIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  taskIndicatorMultiple: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  multiTaskIndicator: {
    paddingHorizontal: 4,
    height: 14,
    minWidth: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  multiTaskText: {
    fontSize: 8,
    fontWeight: 'bold',
  }
}); 