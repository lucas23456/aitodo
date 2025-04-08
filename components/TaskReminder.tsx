import React, { useEffect, useState } from 'react';
import { View, Text, Switch, StyleSheet, Platform, Modal, TouchableOpacity, Button } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays } from 'date-fns';
import { NotificationService } from '../services/NotificationService';

// Support both task types
interface BaseTaskProps {
  id: string;
  title: string;
  [key: string]: any;
}

interface TaskReminderProps {
  task: BaseTaskProps;
  onUpdateTask: (updatedTask: any) => void;
}

export const TaskReminder: React.FC<TaskReminderProps> = ({ task, onUpdateTask }) => {
  // Handle both reminder and due_date fields
  const reminderValue = task.reminder || task.due_date;
  const [hasReminder, setHasReminder] = useState<boolean>(!!reminderValue);
  const [reminderDate, setReminderDate] = useState<Date | null>(
    reminderValue ? new Date(reminderValue) : null
  );
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  useEffect(() => {
    // Request notification permissions
    NotificationService.requestPermissions();
  }, []);

  useEffect(() => {
    if (reminderValue && !hasReminder) {
      setHasReminder(true);
      setReminderDate(new Date(reminderValue));
    } else if (!reminderValue && hasReminder) {
      setHasReminder(false);
      setReminderDate(null);
    }
  }, [reminderValue]);

  const handleReminderToggle = async (value: boolean) => {
    setHasReminder(value);
    
    if (!value) {
      // Remove reminder
      await NotificationService.cancelTaskReminder(task.id);
      
      onUpdateTask({
        ...task,
        reminder: null
      });
      
      setReminderDate(null);
    } else if (!reminderDate) {
      // Set default reminder to tomorrow
      const tomorrow = addDays(new Date(), 1);
      
      setReminderDate(tomorrow);
      setModalVisible(true);
    }
  };

  const handleSetReminder = async (days: number) => {
    const selectedDate = addDays(new Date(), days);
    setReminderDate(selectedDate);
    setModalVisible(false);
    
    // Update task with reminder
    const updatedTask = {
      ...task,
      reminder: selectedDate.toISOString()
    };
    
    onUpdateTask(updatedTask);
    
    // Determine which task type and adapt for notification service
    const notificationTask = {
      id: task.id,
      title: task.title,
      due_date: selectedDate.toISOString(),
      is_completed: task.is_completed || task.completed
    };
    
    // Schedule notification
    await NotificationService.updateTaskReminder(notificationTask as any);
  };

  const openDatePicker = () => {
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.reminderRow}>
        <View style={styles.reminderLabel}>
          <Ionicons name="notifications-outline" size={20} color="#555" />
          <Text style={styles.labelText}>Reminder</Text>
        </View>
        <Switch
          value={hasReminder}
          onValueChange={handleReminderToggle}
          trackColor={{ false: '#d1d1d1', true: '#007AFF' }}
        />
      </View>
      
      {hasReminder && reminderDate && (
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>
            {format(reminderDate, 'MMM d, yyyy h:mm a')}
          </Text>
          <TouchableOpacity 
            onPress={openDatePicker}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Reminder</Text>
            
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => handleSetReminder(0)}
            >
              <Text style={styles.optionText}>Today</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => handleSetReminder(1)}
            >
              <Text style={styles.optionText}>Tomorrow</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => handleSetReminder(3)}
            >
              <Text style={styles.optionText}>In 3 days</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => handleSetReminder(7)}
            >
              <Text style={styles.optionText}>In 1 week</Text>
            </TouchableOpacity>
            
            <Button 
              title="Cancel" 
              onPress={() => setModalVisible(false)} 
              color="#ff3b30"
            />
            
            <TouchableOpacity 
              style={[styles.optionButton, { marginTop: 20, backgroundColor: '#f0f0f0' }]}
              onPress={() => {
                NotificationService.showTestNotification();
                setModalVisible(false);
              }}
            >
              <Text style={styles.optionText}>Test Notification</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  dateText: {
    fontSize: 15,
    color: '#444',
  },
  editButton: {
    padding: 6,
  },
  editButtonText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  optionButton: {
    width: '100%',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
  }
}); 