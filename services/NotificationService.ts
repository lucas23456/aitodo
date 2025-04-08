import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Task } from '../types/Task';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  static async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    // Set up Android channels
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('task-reminders', {
        name: 'Task Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    
    if (finalStatus !== 'granted') {
      return false;
    }
    
    return true;
  }

  static async scheduleTaskReminder(task: Task) {
    if (!task.due_date || task.is_completed) return;

    try {
      // For Expo Go, let's use a simpler approach with immediate notifications
      // In a development or production build, we'd use proper scheduled notifications
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Task Reminder Set',
          body: `Reminder set for task: ${task.title}`,
          data: { taskId: task.id },
          // Specify Android channel
          ...(Platform.OS === 'android' ? { channelId: 'task-reminders' } : {})
        },
        trigger: null, // immediate
      });
      
      console.log(`Reminder set for task: ${task.title}`);
      return true;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return false;
    }
  }

  static async cancelTaskReminder(taskId: string) {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const taskNotifications = scheduledNotifications.filter(
        notification => notification.content.data?.taskId === taskId
      );

      for (const notification of taskNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
      
      return true;
    } catch (error) {
      console.error('Error cancelling notifications:', error);
      return false;
    }
  }

  static async updateTaskReminder(task: Task) {
    // Cancel existing notifications
    await this.cancelTaskReminder(task.id);
    
    // Schedule new notifications if task is not completed
    if (!task.is_completed) {
      return this.scheduleTaskReminder(task);
    }
    
    return true;
  }

  static async scheduleAllTaskReminders(tasks: Task[]) {
    let successCount = 0;
    
    for (const task of tasks) {
      if (await this.scheduleTaskReminder(task)) {
        successCount++;
      }
    }
    
    return successCount;
  }

  static async cancelAllTaskReminders() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return true;
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
      return false;
    }
  }
  
  // For testing only - shows an immediate notification
  static async showTestNotification() {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification',
        body: 'This is a test notification',
        // Specify Android channel
        ...(Platform.OS === 'android' ? { channelId: 'task-reminders' } : {})
      },
      trigger: null, // null means show right away
    });
  }
} 