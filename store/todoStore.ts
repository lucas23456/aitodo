import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  createdAt: string;
  category: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  company?: string;
  estimatedTime?: string;
}

interface TodoState {
  tasks: Task[];
  isDarkMode: boolean;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (task: Task) => void;
  toggleTaskStatus: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  toggleDarkMode: () => void;
}

const STORAGE_KEY = '@todo_app_tasks';
const DARK_MODE_KEY = '@todo_app_dark_mode';

// Helper function to persist tasks to AsyncStorage
const persistTasks = async (tasks: Task[]) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving tasks:', error);
  }
};

// Helper function to persist dark mode setting
const persistDarkMode = async (isDarkMode: boolean) => {
  try {
    await AsyncStorage.setItem(DARK_MODE_KEY, JSON.stringify(isDarkMode));
  } catch (error) {
    console.error('Error saving dark mode setting:', error);
  }
};

// Initialize the store with data from AsyncStorage
export const initializeStore = async () => {
  try {
    const storedTasks = await AsyncStorage.getItem(STORAGE_KEY);
    if (storedTasks) {
      useTodoStore.setState({ tasks: JSON.parse(storedTasks) });
    }
    
    const storedDarkMode = await AsyncStorage.getItem(DARK_MODE_KEY);
    if (storedDarkMode) {
      useTodoStore.setState({ isDarkMode: JSON.parse(storedDarkMode) });
    }
  } catch (error) {
    console.error('Error loading data from storage:', error);
  }
};

export const useTodoStore = create<TodoState>((set) => ({
  tasks: [],
  isDarkMode: false,
  
  addTask: (task) => set((state) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      tags: task.tags || [],
      category: task.category || '',
      priority: task.priority || 'medium',
    };
    const updatedTasks = [...state.tasks, newTask];
    persistTasks(updatedTasks);
    return { tasks: updatedTasks };
  }),
  
  updateTask: (updatedTask) => set((state) => {
    const updatedTasks = state.tasks.map((task) => 
      task.id === updatedTask.id ? updatedTask : task
    );
    persistTasks(updatedTasks);
    return { tasks: updatedTasks };
  }),
  
  toggleTaskStatus: (taskId) => set((state) => {
    const updatedTasks = state.tasks.map((task) => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    persistTasks(updatedTasks);
    return { tasks: updatedTasks };
  }),
  
  deleteTask: (taskId) => set((state) => {
    const updatedTasks = state.tasks.filter((task) => task.id !== taskId);
    persistTasks(updatedTasks);
    return { tasks: updatedTasks };
  }),
  
  toggleDarkMode: () => set((state) => {
    const newDarkMode = !state.isDarkMode;
    persistDarkMode(newDarkMode);
    return { isDarkMode: newDarkMode };
  }),
})); 