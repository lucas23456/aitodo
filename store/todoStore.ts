import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  dueTime?: string; // время задачи в формате HH:mm
  completed: boolean;
  createdAt: string;
  category: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  company?: string;
  estimatedTime?: string;
  projectId?: string;
  // Повторяемость задачи
  repeat?: {
    type: 'daily' | 'weekly' | 'monthly' | 'none';
    interval: number; // интервал (каждые X дней/недель/месяцев)
    endDate?: string; // дата окончания повторений (опционально)
  };
  // Настройки уведомлений
  notification?: {
    enabled: boolean;
    time: string; // время уведомления в формате ISO или HH:mm
    beforeMinutes?: number; // за сколько минут до задачи (0 = в момент задачи)
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
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (task: Task) => void;
  toggleTaskStatus: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  deleteAllTasks: () => void;
  toggleDarkMode: () => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  getProjectTasks: (projectId: string) => Task[];
  addCustomTag: (tag: string) => void;
  deleteCustomTag: (tag: string) => void;
  addCustomCategory: (category: string) => void;
  deleteCustomCategory: (category: string) => void;
}

const STORAGE_KEY = '@todo_app_tasks';
const PROJECTS_KEY = '@todo_app_projects';
const DARK_MODE_KEY = '@todo_app_dark_mode';
const CUSTOM_TAGS_KEY = '@todo_app_custom_tags';
const CUSTOM_CATEGORIES_KEY = '@todo_app_custom_categories';

// Helper function to persist tasks to AsyncStorage
const persistTasks = async (tasks: Task[]) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    // Ошибка сохранения обрабатывается молча
  }
};

// Helper function to persist projects to AsyncStorage
const persistProjects = async (projects: Project[]) => {
  try {
    await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch (error) {
    // Ошибка сохранения обрабатывается молча
  }
};

// Helper function to persist dark mode setting
const persistDarkMode = async (isDarkMode: boolean) => {
  try {
    await AsyncStorage.setItem(DARK_MODE_KEY, JSON.stringify(isDarkMode));
  } catch (error) {
    // Ошибка сохранения обрабатывается молча
  }
};

// Helper function to persist custom tags to AsyncStorage
const persistCustomTags = async (customTags: string[]) => {
  try {
    await AsyncStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(customTags));
  } catch (error) {
    // Ошибка сохранения обрабатывается молча
  }
};

// Helper function to persist custom categories to AsyncStorage
const persistCustomCategories = async (customCategories: string[]) => {
  try {
    await AsyncStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(customCategories));
  } catch (error) {
    // Ошибка сохранения обрабатывается молча
  }
};

// Initialize the store with data from AsyncStorage
export const initializeStore = async () => {
  try {
    // Загружаем задачи
    const storedTasks = await AsyncStorage.getItem(STORAGE_KEY);
    if (storedTasks) {
      const parsedTasks = JSON.parse(storedTasks);
      useTodoStore.setState({ tasks: parsedTasks });
    }
    
    // Загружаем проекты
    const storedProjects = await AsyncStorage.getItem(PROJECTS_KEY);
    if (storedProjects) {
      const parsedProjects = JSON.parse(storedProjects);
      useTodoStore.setState({ projects: parsedProjects });
    }
    
    // Загружаем настройки темной темы
    const storedDarkMode = await AsyncStorage.getItem(DARK_MODE_KEY);
    if (storedDarkMode) {
      const isDarkMode = JSON.parse(storedDarkMode);
      useTodoStore.setState({ isDarkMode });
    }
    
    // Загружаем пользовательские теги
    const storedCustomTags = await AsyncStorage.getItem(CUSTOM_TAGS_KEY);
    if (storedCustomTags) {
      const customTags = JSON.parse(storedCustomTags);
      useTodoStore.setState({ customTags });
    }
    
    // Загружаем пользовательские категории
    const storedCustomCategories = await AsyncStorage.getItem(CUSTOM_CATEGORIES_KEY);
    if (storedCustomCategories) {
      const customCategories = JSON.parse(storedCustomCategories);
      useTodoStore.setState({ customCategories });
    }
    
    return true;
  } catch (error) {
    // Обрабатываем ошибки без логирования
    throw error;
  }
};

export const useTodoStore = create<TodoState>((set, get) => ({
  tasks: [],
  projects: [],
  isDarkMode: false,
  customTags: [],
  customCategories: [],
  
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
    // Find the task to toggle
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return state;
    
    // Create a copy of tasks array for modification
    let updatedTasks = [...state.tasks];
    
    // If this is a repeating task being marked as completed
    if (!task.completed && task.repeat && task.repeat.type !== 'none') {
      // Calculate the next occurrence date
      const createNextOccurrence = () => {
        const currentDate = new Date(task.dueDate);
        let nextDate = new Date(currentDate);
        
        // Calculate the next date based on repeat type and interval
        switch(task.repeat!.type) {
          case 'daily':
            nextDate.setDate(currentDate.getDate() + task.repeat!.interval);
            break;
          case 'weekly':
            nextDate.setDate(currentDate.getDate() + (7 * task.repeat!.interval));
            break;
          case 'monthly':
            // Handle monthly repeats correctly across different month lengths
            const day = currentDate.getDate();
            nextDate.setMonth(currentDate.getMonth() + task.repeat!.interval);
            
            // Handle cases where the day doesn't exist in the target month
            const lastDayOfMonth = new Date(
              nextDate.getFullYear(),
              nextDate.getMonth() + 1,
              0
            ).getDate();
            
            if (day > lastDayOfMonth) {
              nextDate.setDate(lastDayOfMonth);
            }
            break;
        }
        
        // Check if we've reached the end date
        if (task.repeat!.endDate && nextDate > new Date(task.repeat!.endDate)) {
          return null; // No more occurrences
        }
        
        // Create a new task for the next occurrence
        const newTask: Task = {
          ...task,
          id: Date.now().toString(), // New ID for the new occurrence
          dueDate: nextDate.toISOString(),
          completed: false,
          createdAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
        };
        
        return newTask;
      };
      
      // Create the next occurrence and add it to the task list if not null
      const nextOccurrence = createNextOccurrence();
      if (nextOccurrence) {
        updatedTasks.push(nextOccurrence);
      }
    }
    
    // Toggle the completed status of the original task
    updatedTasks = updatedTasks.map((t) => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    
    persistTasks(updatedTasks);
    return { tasks: updatedTasks };
  }),
  
  deleteTask: (taskId) => set((state) => {
    const updatedTasks = state.tasks.filter((task) => task.id !== taskId);
    persistTasks(updatedTasks);
    return { tasks: updatedTasks };
  }),
  
  deleteAllTasks: () => set(() => {
    persistTasks([]);
    return { tasks: [] };
  }),
  
  toggleDarkMode: () => set((state) => {
    const newDarkMode = !state.isDarkMode;
    persistDarkMode(newDarkMode);
    return { isDarkMode: newDarkMode };
  }),
  
  addProject: (project) => set((state) => {
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      createdAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
    };
    const updatedProjects = [...state.projects, newProject];
    persistProjects(updatedProjects);
    return { projects: updatedProjects };
  }),
  
  updateProject: (updatedProject) => set((state) => {
    const updatedProjects = state.projects.map((project) => 
      project.id === updatedProject.id ? updatedProject : project
    );
    persistProjects(updatedProjects);
    return { projects: updatedProjects };
  }),
  
  deleteProject: (projectId) => set((state) => {
    const updatedProjects = state.projects.filter(
      (project) => project.id !== projectId
    );
    
    const updatedTasks = state.tasks.map((task) => 
      task.projectId === projectId 
        ? { ...task, projectId: undefined } 
        : task
    );
    
    persistProjects(updatedProjects);
    persistTasks(updatedTasks);
    
    return { 
      projects: updatedProjects,
      tasks: updatedTasks
    };
  }),
  
  getProjectTasks: (projectId) => {
    const state = get();
    return state.tasks.filter(task => task.projectId === projectId);
  },
  
  addCustomTag: (tag) => set((state) => {
    // Don't add duplicate tags
    if (state.customTags.includes(tag)) {
      return state;
    }
    
    const updatedTags = [...state.customTags, tag];
    persistCustomTags(updatedTags);
    return { customTags: updatedTags };
  }),
  
  deleteCustomTag: (tag) => set((state) => {
    const updatedTags = state.customTags.filter(t => t !== tag);
    
    // Also remove this tag from any tasks that have it
    const updatedTasks = state.tasks.map(task => {
      if (task.tags.includes(tag)) {
        return {
          ...task,
          tags: task.tags.filter(t => t !== tag)
        };
      }
      return task;
    });
    
    persistCustomTags(updatedTags);
    persistTasks(updatedTasks);
    
    return { 
      customTags: updatedTags,
      tasks: updatedTasks
    };
  }),
  
  addCustomCategory: (category) => set((state) => {
    // Don't add duplicate categories
    if (state.customCategories.includes(category)) {
      return state;
    }
    
    const updatedCategories = [...state.customCategories, category];
    persistCustomCategories(updatedCategories);
    return { customCategories: updatedCategories };
  }),
  
  deleteCustomCategory: (category) => set((state) => {
    const updatedCategories = state.customCategories.filter(c => c !== category);
    
    // Also remove this category from any tasks that have it
    const updatedTasks = state.tasks.map(task => {
      if (task.category === category) {
        return {
          ...task,
          category: '' // Reset to empty string instead of undefined
        };
      }
      return task;
    });
    
    persistCustomCategories(updatedCategories);
    persistTasks(updatedTasks);
    
    return { 
      customCategories: updatedCategories,
      tasks: updatedTasks
    };
  }),
})); 