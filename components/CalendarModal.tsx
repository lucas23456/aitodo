import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { format } from 'date-fns';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import { useTodoStore } from '@/store/todoStore';

type CalendarModalProps = {
  visible: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  markedDates?: Record<string, any>;
};

export default function CalendarModal({ 
  visible, 
  onClose, 
  selectedDate, 
  onSelectDate,
  markedDates = {}
}: CalendarModalProps) {
  const colorScheme = useColorScheme();
  const isDarkMode = useTodoStore((state) => state.isDarkMode);
  const colors = Colors[isDarkMode ? 'dark' : 'light'];
  
  // Format the selected date to YYYY-MM-DD for the calendar
  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  
  // Theme for calendar
  const calendarTheme = {
    backgroundColor: 'transparent',
    calendarBackground: 'transparent',
    textSectionTitleColor: colors.text,
    textSectionTitleDisabledColor: colors.secondaryText,
    selectedDayBackgroundColor: colors.primary,
    selectedDayTextColor: isDarkMode ? '#000000' : '#FFFFFF',
    todayTextColor: colors.primary,
    dayTextColor: colors.text,
    textDisabledColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
    dotColor: colors.primary,
    selectedDotColor: isDarkMode ? '#000000' : '#FFFFFF',
    arrowColor: colors.primary,
    disabledArrowColor: colors.secondaryText,
    monthTextColor: colors.text,
    indicatorColor: colors.primary,
    textDayFontWeight: '400' as const,
    textMonthFontWeight: 'bold' as const,
    textDayHeaderFontWeight: '500' as const,
    textDayFontSize: 16,
    textMonthFontSize: 16,
    textDayHeaderFontSize: 14
  };
  
  // Add the selected date to the marked dates
  const markedDatesWithSelection = {
    ...markedDates,
    [formattedDate]: {
      selected: true,
      ...(markedDates[formattedDate] || {})
    }
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[
        styles.container, 
        { backgroundColor: isDarkMode ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255,255,255,0.95)' }
      ]}>
        <View style={[
          styles.content, 
          { 
            backgroundColor: colors.card,
            borderWidth: isDarkMode ? 1 : 0,
            borderColor: isDarkMode ? 'rgba(125, 187, 245, 0.2)' : 'transparent',
          }
        ]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Calendar</Text>
            <TouchableOpacity 
              onPress={onClose} 
              style={[
                styles.closeButton,
                isDarkMode && styles.closeButtonDark
              ]}
            >
              <MaterialIcons name="close" size={24} color={isDarkMode ? colors.primary : colors.gray} />
            </TouchableOpacity>
          </View>
          
          <Calendar
            theme={calendarTheme}
            onDayPress={(day: DateData) => {
              const selectedDate = new Date(day.timestamp);
              onSelectDate(selectedDate);
              onClose();
            }}
            markedDates={markedDatesWithSelection}
            enableSwipeMonths={true}
            initialDate={formattedDate}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  closeButtonDark: {
    backgroundColor: 'rgba(125, 187, 245, 0.1)',
  }
}); 