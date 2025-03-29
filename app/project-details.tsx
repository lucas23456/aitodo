import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  FlatList, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useTodoStore, Task, Project } from '@/store/todoStore';
import TaskItem from '@/components/TaskItem';
import TaskForm from '@/components/TaskForm';
import EmptyState from '@/components/EmptyState';
import CapsuleMenu from '@/components/CapsuleMenu';

export default function ProjectDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDarkMode = useTodoStore((state) => state.isDarkMode);
  const colors = Colors[isDarkMode ? 'dark' : 'light'];
  
  const projects = useTodoStore((state) => state.projects);
  const project = projects.find(p => p.id === id);
  const tasks = useTodoStore((state) => state.tasks).filter(t => t.projectId === id);
  
  const addTask = useTodoStore((state) => state.addTask);
  const updateTask = useTodoStore((state) => state.updateTask);
  const toggleTaskStatus = useTodoStore((state) => state.toggleTaskStatus);
  const deleteTask = useTodoStore((state) => state.deleteTask);
  const deleteProject = useTodoStore((state) => state.deleteProject);
  
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  
  if (!project) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: colors.card }]}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Project Not Found</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const handleAddTask = () => {
    setSelectedTask(undefined);
    setIsFormVisible(true);
  };
  
  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsFormVisible(true);
  };
  
  const handleTaskPress = (task: Task) => {
    router.push({
      pathname: '/task-details',
      params: { id: task.id }
    });
  };
  
  const handleSubmitTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    if (selectedTask) {
      updateTask({ ...selectedTask, ...task });
    } else {
      // Add the projectId to the task
      addTask({ ...task, projectId: project.id });
    }
    setIsFormVisible(false);
  };
  
  const handleDeleteProject = () => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${project.name}"? This will remove the project but keep its tasks.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteProject(project.id);
            router.back();
          }
        }
      ]
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.card }]}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Project Details</Text>
        <TouchableOpacity 
          style={[styles.deleteButton, { backgroundColor: colors.danger }]}
          onPress={handleDeleteProject}
        >
          <MaterialIcons name="delete" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {/* Project Info */}
      <View style={[styles.projectHeader, { backgroundColor: colors.card }]}>
        <View style={[styles.projectColorBadge, { backgroundColor: project.color }]} />
        <View style={styles.projectInfo}>
          <Text style={[styles.projectTitle, { color: colors.text }]}>{project.name}</Text>
          <Text style={[styles.projectDescription, { color: colors.secondaryText }]}>
            {project.description}
          </Text>
        </View>
      </View>
      
      {/* Tasks List */}
      <View style={styles.tasksContainer}>
        <View style={styles.tasksHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tasks</Text>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleAddTask}
          >
            <MaterialIcons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Task</Text>
          </TouchableOpacity>
        </View>
        
        {tasks.length === 0 ? (
          <EmptyState message={`No tasks in ${project.name} yet!`} />
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TaskItem
                task={item}
                onToggleComplete={toggleTaskStatus}
                onDelete={deleteTask}
                onPress={handleTaskPress}
                onEdit={handleEditTask}
              />
            )}
            contentContainerStyle={styles.tasksList}
          />
        )}
      </View>
      
      {/* Task Form Modal */}
      <TaskForm
        visible={isFormVisible}
        onClose={() => setIsFormVisible(false)}
        onSubmit={handleSubmitTask}
        initialTask={selectedTask}
      />
      
      <CapsuleMenu />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
    flex: 1,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectHeader: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  projectColorBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  projectInfo: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  projectDescription: {
    fontSize: 14,
  },
  tasksContainer: {
    flex: 1,
    paddingBottom: 100, // Space for capsule menu
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  tasksList: {
    paddingHorizontal: 16,
  },
}); 