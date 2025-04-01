package com.minimind.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class AlarmService extends Service {
    private static final String TAG = "AlarmService";
    private static final String CHANNEL_ID = "AlarmServiceChannel";
    private static final int NOTIFICATION_ID = 1;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Alarm service created");
        
        // Создаем канал уведомлений для Android 8.0 и выше
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "Alarm service started");
        
        // Создаем намерение для открытия приложения при нажатии на уведомление
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 
            0, 
            notificationIntent, 
            PendingIntent.FLAG_IMMUTABLE
        );
        
        // Создаем уведомление для foreground service
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Будильник")
            .setContentText("Воспроизведение будильника")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .build();
        
        // Запускаем сервис в режиме foreground
        startForeground(NOTIFICATION_ID, notification);
        
        // Отправляем событие в React Native о необходимости воспроизвести звук
        // Это будет обработано через уведомление в приложении
        try {
            Intent alarmEvent = new Intent("com.todo.voicetodo.ALARM_TRIGGERED");
            sendBroadcast(alarmEvent);
        } catch (Exception e) {
            Log.e(TAG, "Error sending broadcast", e);
        }
        
        // Если сервис убит системой, он будет перезапущен
        return START_STICKY;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null; // Мы не используем привязанный сервис
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "Alarm service destroyed");
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                CHANNEL_ID,
                "Alarm Service Channel",
                NotificationManager.IMPORTANCE_HIGH
            );
            serviceChannel.setDescription("Канал для уведомлений будильника");
            serviceChannel.enableVibration(true);
            serviceChannel.setVibrationPattern(new long[]{0, 250, 250, 250});
            serviceChannel.setSound(null, null); // Звук будет воспроизводиться через приложение
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }
}