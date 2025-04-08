import { create } from 'zustand';
import { TaskService } from '../services/TaskService';
import { Task as SupabaseTask, Priority } from '../types/Task';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

// Define local Task type that maps to our store
export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  dueTime?: string;
  completed: boolean;
  createdAt: string;
  category: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  company?: string;
  estimatedTime?: string;
  projectId?: string;
  repeat?: {
    type: 'daily' | 'weekly' | 'monthly' | 'none';
    interval: number;
    endDate?: string;
  };
  notification?: {
    enabled: boolean;
    time: string;
    beforeMinutes?: number;
  };
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
}

interface TodoState {
  tasks: Task[];
  projects: Project[];
  isDarkMode: boolean;
  customTags: string[];
  customCategories: string[];
  isLoading: boolean;
  error: string | null;

  // Task actions
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  toggleTaskStatus: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  deleteAllTasks: () => Promise<void>;

  // Project actions
  fetchProjects: () => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<void>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  getProjectTasks: (projectId: string) => Task[];

  // Preferences actions
  toggleDarkMode: () => void;
  addCustomTag: (tag: string) => void;
  deleteCustomTag: (tag: string) => void;
  addCustomCategory: (category: string) => void;
  deleteCustomCategory: (category: string) => void;
}

// Keys for local storage of preferences
const DARK_MODE_KEY = '@todo_app_dark_mode';
const CUSTOM_TAGS_KEY = '@todo_app_custom_tags';
const CUSTOM_CATEGORIES_KEY = '@todo_app_custom_categories';

// Helper functions for preference persistence
const persistDarkMode = async (isDarkMode: boolean) => {
  try {
    await AsyncStorage.setItem(DARK_MODE_KEY, JSON.stringify(isDarkMode));
  } catch (error) {
    console.error('Error saving dark mode setting:', error);
  }
};

const persistCustomTags = async (customTags: string[]) => {
  try {
    await AsyncStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(customTags));
  } catch (error) {
    console.error('Error saving custom tags:', error);
  }
};

const persistCustomCategories = async (customCategories: string[]) => {
  try {
    await AsyncStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(customCategories));
  } catch (error) {
    console.error('Error saving custom categories:', error);
  }
};

// Converts Supabase Task to local Task format
const mapSupabaseTaskToLocal = (task: SupabaseTask): Task => {
  return {
    id: task.id,
    title: task.title,
    description: task.description || '',
    dueDate: task.due_date || '',
    completed: task.is_completed,
    createdAt: task.created_at,
    category: '', // Default value, can be derived from tags or other fields
    tags: task.tags || [],
    priority: task.priority.toLowerCase() as 'low' | 'medium' | 'high',
    projectId: task.project_id || undefined,
    // Additional fields can be mapped as needed
  };
};

// Converts local Task to Supabase format
const mapLocalTaskToSupabase = (task: Task): Omit<SupabaseTask, 'id' | 'created_at' | 'user_id'> => {
  return {
    title: task.title,
    description: task.description,
    due_date: task.dueDate || null,
    priority: task.priority.toUpperCase() as Priority,
    project_id: task.projectId || null,
    is_completed: task.completed,
    completed_at: task.completed ? new Date().toISOString() : null,
    tags: task.tags,
    // Map other fields as needed
  };
};

// Initialize the store with data from storage
export const initializeStore = async () => {
  try {
    // Load dark mode setting
    const storedDarkMode = await AsyncStorage.getItem(DARK_MODE_KEY);
    if (storedDarkMode) {
      const isDarkMode = JSON.parse(storedDarkMode);
      useSupabaseTodoStore.setState({ isDarkMode });
    }

    // Load custom tags
    const storedCustomTags = await AsyncStorage.getItem(CUSTOM_TAGS_KEY);
    if (storedCustomTags) {
      const customTags = JSON.parse(storedCustomTags);
      useSupabaseTodoStore.setState({ customTags });
    }

    // Load custom categories
    const storedCustomCategories = await AsyncStorage.getItem(CUSTOM_CATEGORIES_KEY);
    if (storedCustomCategories) {
      const customCategories = JSON.parse(storedCustomCategories);
      useSupabaseTodoStore.setState({ customCategories });
    }

    // Load tasks from Supabase
    await useSupabaseTodoStore.getState().fetchTasks();

    return true;
  } catch (error) {
    console.error('Error initializing store:', error);
    return false;
  }
};

export const useSupabaseTodoStore = create<TodoState>((set, get) => ({
  tasks: [],
  projects: [],
  isDarkMode: false,
  customTags: [],
  customCategories: [],
  isLoading: false,
  error: null,

  // Task actions
  fetchTasks: async () => {
    try {
      set({ isLoading: true, error: null });
      const supabaseTasks = await TaskService.getTasks();
      const localTasks = supabaseTasks.map(mapSupabaseTaskToLocal);
      set({ tasks: localTasks, isLoading: false });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      set({ error: 'Failed to fetch tasks', isLoading: false });
    }
  },

  addTask: async (task) => {
    try {
      set({ isLoading: true, error: null });
      const supabaseTask = mapLocalTaskToSupabase(task as Task);
      const newSupabaseTask = await TaskService.createTask(supabaseTask as any);
      const newLocalTask = mapSupabaseTaskToLocal(newSupabaseTask);

      set((state) => ({
        tasks: [...state.tasks, newLocalTask],
        isLoading: false
      }));
    } catch (error) {
      console.error('Error adding task:', error);
      set({ error: 'Failed to add task', isLoading: false });
    }
  },

  updateTask: async (updatedTask) => {
    try {
      set({ isLoading: true, error: null });
      const supabaseTask = {
        id: updatedTask.id,
        ...mapLocalTaskToSupabase(updatedTask)
      };

      await TaskService.updateTask(supabaseTask as any);

      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === updatedTask.id ? updatedTask : task
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error('Error updating task:', error);
      set({ error: 'Failed to update task', isLoading: false });
    }
  },

  toggleTaskStatus: async (taskId) => {
    try {
      set({ isLoading: true, error: null });
      const task = get().tasks.find((t) => t.id === taskId);
      if (!task) {
        set({ isLoading: false });
        return;
      }

      const newStatus = !task.completed;

      await TaskService.toggleTaskCompletion(taskId, newStatus);

      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, completed: newStatus } : t
        ),
        isLoading: false
      }));

      // Handle recurring tasks if needed
      if (newStatus && task.repeat && task.repeat.type !== 'none') {
        // Implementation for recurring tasks would go here
      }
    } catch (error) {
      console.error('Error toggling task status:', error);
      set({ error: 'Failed to update task status', isLoading: false });
    }
  },

  deleteTask: async (taskId) => {
    try {
      set({ isLoading: true, error: null });
      await TaskService.deleteTask(taskId);

      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== taskId),
        isLoading: false
      }));
    } catch (error) {
      console.error('Error deleting task:', error);
      set({ error: 'Failed to delete task', isLoading: false });
    }
  },

  deleteAllTasks: async () => {
    try {
      set({ isLoading: true, error: null });
      // This would require batch delete support in TaskService
      // For now, we'll delete each task individually
      const tasks = get().tasks;
      for (const task of tasks) {
        await TaskService.deleteTask(task.id);
      }

      set({ tasks: [], isLoading: false });
    } catch (error) {
      console.error('Error deleting all tasks:', error);
      set({ error: 'Failed to delete all tasks', isLoading: false });
    }
  },

  // Project actions
  fetchProjects: async () => {
    // Implementation for fetching projects would go here
    set({ isLoading: false });
  },

  addProject: async (project) => {
    // Implementation for adding projects would go here
    set({ isLoading: false });
  },

  updateProject: async (project) => {
    // Implementation for updating projects would go here
    set({ isLoading: false });
  },

  deleteProject: async (projectId) => {
    // Implementation for deleting projects would go here
    set({ isLoading: false });
  },

  getProjectTasks: (projectId) => {
    return get().tasks.filter((task) => task.projectId === projectId);
  },

  // Preferences actions
  toggleDarkMode: () => set((state) => {
    const newDarkMode = !state.isDarkMode;
    persistDarkMode(newDarkMode);
    return { isDarkMode: newDarkMode };
  }),

  addCustomTag: (tag) => set((state) => {
    if (state.customTags.includes(tag)) return state;
    const newTags = [...state.customTags, tag];
    persistCustomTags(newTags);
    return { customTags: newTags };
  }),

  deleteCustomTag: (tag) => set((state) => {
    const newTags = state.customTags.filter((t) => t !== tag);
    persistCustomTags(newTags);
    return { customTags: newTags };
  }),

  addCustomCategory: (category) => set((state) => {
    if (state.customCategories.includes(category)) return state;
    const newCategories = [...state.customCategories, category];
    persistCustomCategories(newCategories);
    return { customCategories: newCategories };
  }),

  deleteCustomCategory: (category) => set((state) => {
    const newCategories = state.customCategories.filter((c) => c !== category);
    persistCustomCategories(newCategories);
    return { customCategories: newCategories };
  }),
})); 