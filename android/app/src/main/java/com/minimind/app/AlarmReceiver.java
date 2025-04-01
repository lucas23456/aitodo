package com.minimind.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

public class AlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "AlarmReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "Alarm received: " + intent.getAction());
        
        // При получении сигнала будильника или после перезагрузки устройства
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction()) ||
            "android.intent.action.ALARM_RECEIVER".equals(intent.getAction())) {
            
            // Запускаем сервис для проигрывания будильника
            Intent serviceIntent = new Intent(context, AlarmService.class);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                // Для Android 8.0 и выше используем startForegroundService
                context.startForegroundService(serviceIntent);
            } else {
                // Для более старых версий Android
                context.startService(serviceIntent);
            }
        }
    }
} 