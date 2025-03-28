# VoiceTodo App

A clean and modern Todo application built with React Native and Expo.

## Features

- Create, update, delete, and mark tasks as completed
- Clean and modern UI with a dark mode toggle
- Swipe gestures for task actions
- Local data persistence
- Due date reminders
- Beautiful animations

## Setup and Running

1. **Install dependencies**

```bash
npm install
```

2. **Fix dependencies (if needed)**

If you encounter any dependency issues, run:

```bash
npx expo install @react-native-async-storage/async-storage@1.23.1 @react-native-community/datetimepicker@8.2.0 react-native-gesture-handler@~2.20.2 react-native-reanimated@~3.16.1
```

3. **Start the application**

```bash
npx expo start
```

4. **Run on a device or emulator**

- Scan the QR code with the Expo Go app (Android)
- Scan the QR code with the Camera app (iOS)
- Press 'a' to run on an Android emulator
- Press 'i' to run on an iOS simulator

## Project Structure

- `/app` - Main application screens and navigation
- `/components` - Reusable UI components
- `/store` - State management using Zustand
- `/constants` - Colors and theme definition
- `/assets` - Images and fonts

## Technologies Used

- React Native
- Expo
- Zustand for state management
- AsyncStorage for data persistence
- React Native Gesture Handler
- React Native Reanimated
- React Navigation (Expo Router)
- TypeScript

## License

MIT
