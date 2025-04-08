# Bell Icons for Notifications

This directory contains several black bell icons for use in your application's notification system.

## Available Icons

1. `bell_icon.png` - A simple 24x24 solid black bell icon
2. `bell_icon_large.png` - A 96x96 solid black bell icon for higher resolutions
3. `bell_outline_icon.png` - A 64x64 black outline bell icon for an alternative style
4. `bell_icon.svg` - SVG vector version of the bell icon (can be scaled to any size)

## Usage in React Native

### Using with Image component

```jsx
import { Image } from "react-native";

// Use the icon in your component
<Image
  source={require("../assets/images/bell_icon.png")}
  style={{ width: 24, height: 24 }}
/>;
```

### Using with Expo Vector Icons

If you prefer to use the standard notification icon from a vector icon library, you can use:

```jsx
import { MaterialIcons } from "@expo/vector-icons";

// Use the icon in your component
<MaterialIcons name="notifications" size={24} color="black" />;
```

## Usage in Notifications

To use these icons for your app's notifications, update your notification service code:

```javascript
// In your notification service file
const content = {
  title: task.title,
  body: task.description || "Пора приступить к задаче!",
  data: { taskId: task.id },
  sound: true,
  badge: 1,
  // For Android, you can set a custom icon
  // This requires additional setup in Android resources
};

// For Android notification channel
if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("default", {
    name: "Task Notifications",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: "default",
    lightColor: "#FF231F7C",
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
  });
}
```

## Android Configuration

For Android, you'll need to add the bell icon to your Android resources. Place the icon in:

```
android/app/src/main/res/drawable/notification_icon.png
```

Then update your notification builder in Java to use this icon:

```java
.setSmallIcon(R.drawable.notification_icon)
```

Instead of:

```java
.setSmallIcon(R.mipmap.ic_launcher)
```
