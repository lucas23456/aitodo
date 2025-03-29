import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { addDays, format, isToday, isSameDay, startOfWeek } from 'date-fns';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';

type DateSliderProps = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onPressHeader?: () => void;
  dates?: Date[];
};

export default function DateSlider({ selectedDate, onSelectDate, onPressHeader, dates: propDates }: DateSliderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
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
  
  // Format day name (Mon, Tue, etc)
  const formatDayName = (date: Date) => {
    return format(date, 'EEE').toLowerCase();
  };
  
  // Format day number
  const formatDayNumber = (date: Date) => {
    return format(date, 'd');
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
        {dates.map((date, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dateItem,
              isSameDay(date, selectedDate) && 
                [styles.selectedDateItem, { backgroundColor: colors.card }]
            ]}
            onPress={() => onSelectDate(date)}
          >
            <Text
              style={[
                styles.dayName,
                { color: colors.secondaryText },
                isSameDay(date, selectedDate) && { color: colors.text }
              ]}
            >
              {formatDayName(date)}
            </Text>
            <Text
              style={[
                styles.dayNumber,
                { color: colors.text },
                isSameDay(date, selectedDate) && { color: colors.text, fontWeight: '600' }
              ]}
            >
              {formatDayNumber(date)}
            </Text>
          </TouchableOpacity>
        ))}
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
    width: 40,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    borderRadius: 20,
  },
  selectedDateItem: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dayName: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'lowercase',
  },
  dayNumber: {
    fontSize: 16,
  },
}); 