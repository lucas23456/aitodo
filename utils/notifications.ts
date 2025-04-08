import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Настройка способа отображения уведомлений
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Запрос разрешения на показ уведомлений
export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Запрашиваем разрешение только если еще не получено
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    // Create a channel for task reminders with high importance
    await Notifications.setNotificationChannelAsync('task-reminders', {
      name: 'Task Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
    });

    // Create a channel for general notifications
    await Notifications.setNotificationChannelAsync('default', {
      name: 'General Notifications',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  // Для iOS необходимы дополнительные шаги
  if (Platform.OS === 'ios') {
    await Notifications.setNotificationCategoryAsync('task-reminder', [
      {
        identifier: 'complete',
        buttonTitle: 'Выполнить задачу',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'postpone',
        buttonTitle: 'Отложить на 30 минут',
        options: {
          opensAppToForeground: false,
        },
      },
    ]);
  }

  return finalStatus === 'granted';
}

// Планирование уведомления для задачи
export async function scheduleTaskNotification(task: {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  dueTime?: string;
  notification?: {
    enabled: boolean;
    time?: string;
    beforeMinutes?: number;
    customTime?: string;
  };
}) {
  // Если уведомления не включены для задачи, выходим
  if (!task.notification?.enabled) {
    return null;
  }

  try {
    // Сначала отменяем любые существующие уведомления для этой задачи
    await cancelTaskNotification(task.id);

    // Получаем время задачи
    const taskDueDate = new Date(task.dueDate);
    
    // Если установлено время, добавляем его к дате
    if (task.dueTime) {
      const [hours, minutes] = task.dueTime.split(':').map(Number);
      taskDueDate.setHours(hours, minutes, 0, 0);
    }

    // Вычисляем время для уведомления
    let notificationTime: Date;
    
    // Если указано конкретное время для уведомления, используем его
    if (task.notification.customTime) {
      const [hours, minutes] = task.notification.customTime.split(':').map(Number);
      notificationTime = new Date();
      notificationTime.setHours(hours, minutes, 0, 0);
      
      // Если время уведомления уже прошло для сегодня, переносим на завтра
      if (notificationTime < new Date()) {
        notificationTime.setDate(notificationTime.getDate() + 1);
      }
    } 
    // Если задан интервал до задачи, рассчитываем время
    else if (task.notification.beforeMinutes && task.notification.beforeMinutes > 0) {
      notificationTime = new Date(taskDueDate.getTime() - task.notification.beforeMinutes * 60 * 1000);
    } 
    // По умолчанию уведомление в момент задачи
    else {
      notificationTime = new Date(taskDueDate);
    }

    // Если время уведомления уже прошло, не планируем его
    if (notificationTime <= new Date()) {
      return null;
    }

    // Подготавливаем содержимое уведомления
    const content: Notifications.NotificationContentInput = {
      title: task.title,
      body: task.description || 'Пора приступить к задаче!',
      data: { taskId: task.id },
      sound: true,
      badge: 1,
    };

    // Подготавливаем триггер (когда показать уведомление)
    const trigger = {
      channelId: 'default',
      date: notificationTime
    };

    // Планируем уведомление
    const identifier = await Notifications.scheduleNotificationAsync({
      content,
      trigger,
    });

    return identifier;
  } catch (error) {
    return null;
  }
}

// Отмена запланированного уведомления для задачи
export async function cancelTaskNotification(taskId: string) {
  try {
    // Получаем все запланированные уведомления
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    // Ищем уведомления, связанные с нашей задачей
    for (const notification of scheduledNotifications) {
      if (notification.content.data?.taskId === taskId) {
        // Отменяем уведомление
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  } catch (error) {
    // Игнорируем ошибку
  }
}

// Функция для обработки повторяющихся задач
export async function scheduleRepeatingTaskNotifications(task: {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  dueTime?: string;
  notification?: {
    enabled: boolean;
    time?: string;
    beforeMinutes?: number;
    customTime?: string;
  };
  repeat?: {
    type: 'daily' | 'weekly' | 'monthly' | 'none';
    interval: number;
    endDate?: string;
  };
}) {
  // Если задача не повторяется или уведомления не включены, выходим
  if (!task.repeat || task.repeat.type === 'none' || !task.notification?.enabled) {
    return await scheduleTaskNotification(task);
  }

  // Планируем первое уведомление
  const firstNotificationId = await scheduleTaskNotification(task);
  
  // Для повторяющихся задач в будущем мы можем использовать
  // логику на стороне сервера или планирование при каждом запуске приложения
  // В Expo уведомления можно планировать только на конкретное время
  
  return firstNotificationId;
}

// Функция для прослушивания действий с уведомлениями
export function setupNotificationListeners(
  handleNotificationResponse: (response: Notifications.NotificationResponse) => void
) {
  const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
  return subscription;
} 