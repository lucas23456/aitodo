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
  projectId?: string;
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
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (task: Task) => void;
  toggleTaskStatus: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  toggleDarkMode: () => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  getProjectTasks: (projectId: string) => Task[];
}

const STORAGE_KEY = '@todo_app_tasks';
const PROJECTS_KEY = '@todo_app_projects';
const DARK_MODE_KEY = '@todo_app_dark_mode';

// Helper function to persist tasks to AsyncStorage
const persistTasks = async (tasks: Task[]) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving tasks:', error);
  }
};

// Helper function to persist projects to AsyncStorage
const persistProjects = async (projects: Project[]) => {
  try {
    await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('Error saving projects:', error);
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
    console.log('Loading tasks from AsyncStorage...');
    const storedTasks = await AsyncStorage.getItem(STORAGE_KEY);
    if (storedTasks) {
      const parsedTasks = JSON.parse(storedTasks);
      console.log(`Loaded ${parsedTasks.length} tasks from storage`);
      useTodoStore.setState({ tasks: parsedTasks });
    } else {
      console.log('No tasks found in storage');
    }
    
    console.log('Loading projects from AsyncStorage...');
    const storedProjects = await AsyncStorage.getItem(PROJECTS_KEY);
    if (storedProjects) {
      const parsedProjects = JSON.parse(storedProjects);
      console.log(`Loaded ${parsedProjects.length} projects from storage`);
      useTodoStore.setState({ projects: parsedProjects });
    } else {
      console.log('No projects found in storage');
    }
    
    console.log('Loading dark mode setting from AsyncStorage...');
    const storedDarkMode = await AsyncStorage.getItem(DARK_MODE_KEY);
    if (storedDarkMode) {
      const isDarkMode = JSON.parse(storedDarkMode);
      console.log(`Dark mode setting loaded: ${isDarkMode}`);
      useTodoStore.setState({ isDarkMode });
    } else {
      console.log('No dark mode setting found in storage');
    }
    
    return true;
  } catch (error) {
    console.error('Error loading data from storage:', error);
    throw error;
  }
};

export const useTodoStore = create<TodoState>((set, get) => ({
  tasks: [],
  projects: [],
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
  }
})); 