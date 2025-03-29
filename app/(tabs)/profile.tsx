import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Modal,
  SafeAreaView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useTodoStore, Project } from '@/store/todoStore';
import { useColorScheme } from '@/components/useColorScheme';
import CapsuleMenu from '@/components/CapsuleMenu';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = useTodoStore((state) => state.isDarkMode);
  const colors = Colors[isDarkMode ? 'dark' : 'light'];
  
  const projects = useTodoStore((state) => state.projects);
  const tasks = useTodoStore((state) => state.tasks);
  const addProject = useTodoStore((state) => state.addProject);
  const deleteProject = useTodoStore((state) => state.deleteProject);
  
  const [newProjectModalVisible, setNewProjectModalVisible] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  
  // Setup call modal state
  const [setupCallModalVisible, setSetupCallModalVisible] = useState(false);
  const [callName, setCallName] = useState('');
  const [callDate, setCallDate] = useState('');
  const [callTime, setCallTime] = useState('');
  const [callNotes, setCallNotes] = useState('');
  
  // Handle setup call
  const handleSetupCall = () => {
    // Here you would integrate with your calendar API or save the call details
    alert(`Call scheduled: ${callName} on ${callDate} at ${callTime}`);
    setSetupCallModalVisible(false);
    // Reset form
    setCallName('');
    setCallDate('');
    setCallTime('');
    setCallNotes('');
  };
  
  // Add a new project
  const handleAddProject = () => {
    if (newProjectName.trim()) {
      const newProject = {
        name: newProjectName.trim(),
        description: newProjectDescription.trim(),
        color: '#' + Math.floor(Math.random() * 16777215).toString(16), // Random color
      };
      
      addProject(newProject);
      setNewProjectName('');
      setNewProjectDescription('');
      setNewProjectModalVisible(false);
    }
  };
  
  // Delete a project
  const handleDeleteProject = (id: string) => {
    deleteProject(id);
  };

  // Navigate to project details
  const handleViewProject = (project: Project) => {
    router.push({
      pathname: '/project-details',
      params: { id: project.id }
    });
  };
  
  // Get task count for a project
  const getProjectTaskCount = (projectId: string) => {
    return tasks.filter(task => task.projectId === projectId).length;
  };
  
  // Get total completed task count
  const getCompletedTaskCount = () => {
    return tasks.filter(task => task.completed).length;
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* User Profile Section */}
        <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarText, { color: colorScheme === 'dark' ? colors.card : 'white' }]}>
                JD
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>John Doe</Text>
              <Text style={[styles.profileEmail, { color: colors.secondaryText }]}>john.doe@example.com</Text>
            </View>
          </View>
          
          {/* Setup Call Button */}
          <TouchableOpacity 
            style={[styles.setupCallButton, { backgroundColor: colors.primary }]}
            onPress={() => setSetupCallModalVisible(true)}
          >
            <MaterialIcons name="call" size={20} color="#FFFFFF" />
            <Text style={styles.setupCallText}>Настроить звонок</Text>
          </TouchableOpacity>
          
          <View style={[styles.statsContainer, { borderTopColor: colors.border, borderTopWidth: 1 }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{projects.length}</Text>
              <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Projects</Text>
            </View>
            
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {tasks.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Tasks</Text>
            </View>
            
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{getCompletedTaskCount()}</Text>
              <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Completed</Text>
            </View>
          </View>
        </View>
        
        {/* Projects Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Projects</Text>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setNewProjectModalVisible(true)}
          >
            <MaterialIcons name="add" size={20} color={colorScheme === 'dark' ? colors.card : 'white'} />
          </TouchableOpacity>
        </View>
        
        {projects.length === 0 ? (
          <View style={[styles.emptyProjectsCard, { backgroundColor: colors.card }]}>
            <MaterialIcons name="folder" size={48} color={colors.secondaryText} />
            <Text style={[styles.emptyProjectsText, { color: colors.secondaryText }]}>
              No projects yet. Create your first project!
            </Text>
          </View>
        ) : (
          projects.map(project => (
            <View 
              key={project.id} 
              style={[styles.projectCard, { backgroundColor: colors.card }]}
            >
              <View style={styles.projectHeader}>
                <View style={[styles.projectColor, { backgroundColor: project.color }]} />
                <Text style={[styles.projectName, { color: colors.text }]}>{project.name}</Text>
                <TouchableOpacity onPress={() => handleDeleteProject(project.id)}>
                  <MaterialIcons name="delete-outline" size={22} color={colors.secondaryText} />
                </TouchableOpacity>
              </View>
              
              <Text style={[styles.projectDescription, { color: colors.secondaryText }]}>
                {project.description}
              </Text>
              
              <View style={styles.projectFooter}>
                <View style={styles.projectStat}>
                  <MaterialIcons name="assignment" size={16} color={colors.secondaryText} />
                  <Text style={[styles.projectStatText, { color: colors.secondaryText }]}>
                    {getProjectTaskCount(project.id)} tasks
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.viewProjectButton}
                  onPress={() => handleViewProject(project)}
                >
                  <Text style={[styles.viewProjectText, { color: colors.primary }]}>View</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
      
      {/* New Project Modal */}
      <Modal
        visible={newProjectModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNewProjectModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Project</Text>
              <TouchableOpacity onPress={() => setNewProjectModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={colors.secondaryText} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.inputLabel, { color: colors.text }]}>Project Name</Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: colorScheme === 'dark' ? colors.lightGray : '#F5F5F5',
                  color: colors.text,
                  borderColor: colors.border 
                }
              ]}
              placeholder="Enter project name"
              placeholderTextColor={colors.secondaryText}
              value={newProjectName}
              onChangeText={setNewProjectName}
            />
            
            <Text style={[styles.inputLabel, { color: colors.text }]}>Description</Text>
            <TextInput
              style={[
                styles.input, 
                styles.textArea,
                { 
                  backgroundColor: colorScheme === 'dark' ? colors.lightGray : '#F5F5F5',
                  color: colors.text,
                  borderColor: colors.border 
                }
              ]}
              placeholder="Enter project description"
              placeholderTextColor={colors.secondaryText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={newProjectDescription}
              onChangeText={setNewProjectDescription}
            />
            
            <TouchableOpacity 
              style={[
                styles.addProjectButton, 
                { 
                  backgroundColor: newProjectName.trim() ? colors.primary : colors.lightGray 
                }
              ]}
              onPress={handleAddProject}
              disabled={!newProjectName.trim()}
            >
              <Text 
                style={[
                  styles.addProjectButtonText, 
                  { 
                    color: newProjectName.trim() 
                      ? colorScheme === 'dark' ? colors.card : 'white' 
                      : colors.secondaryText 
                  }
                ]}
              >
                Create Project
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Setup Call Modal */}
      <Modal
        visible={setupCallModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSetupCallModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Настроить звонок</Text>
              <TouchableOpacity onPress={() => setSetupCallModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={colors.secondaryText} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.inputLabel, { color: colors.text }]}>Название</Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: colorScheme === 'dark' ? colors.lightGray : '#F5F5F5',
                  color: colors.text,
                  borderColor: colors.border 
                }
              ]}
              placeholder="Введите название звонка"
              placeholderTextColor={colors.secondaryText}
              value={callName}
              onChangeText={setCallName}
            />
            
            <Text style={[styles.inputLabel, { color: colors.text }]}>Дата</Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: colorScheme === 'dark' ? colors.lightGray : '#F5F5F5',
                  color: colors.text,
                  borderColor: colors.border 
                }
              ]}
              placeholder="DD/MM/YYYY"
              placeholderTextColor={colors.secondaryText}
              value={callDate}
              onChangeText={setCallDate}
            />
            
            <Text style={[styles.inputLabel, { color: colors.text }]}>Время</Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: colorScheme === 'dark' ? colors.lightGray : '#F5F5F5',
                  color: colors.text,
                  borderColor: colors.border 
                }
              ]}
              placeholder="HH:MM"
              placeholderTextColor={colors.secondaryText}
              value={callTime}
              onChangeText={setCallTime}
            />
            
            <Text style={[styles.inputLabel, { color: colors.text }]}>Заметки</Text>
            <TextInput
              style={[
                styles.input, 
                styles.textArea,
                { 
                  backgroundColor: colorScheme === 'dark' ? colors.lightGray : '#F5F5F5',
                  color: colors.text,
                  borderColor: colors.border 
                }
              ]}
              placeholder="Дополнительная информация о звонке"
              placeholderTextColor={colors.secondaryText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={callNotes}
              onChangeText={setCallNotes}
            />
            
            <TouchableOpacity 
              style={[
                styles.addProjectButton, 
                { 
                  backgroundColor: callName.trim() && callDate.trim() && callTime.trim() ? 
                    colors.primary : colors.lightGray 
                }
              ]}
              onPress={handleSetupCall}
              disabled={!callName.trim() || !callDate.trim() || !callTime.trim()}
            >
              <Text 
                style={[
                  styles.addProjectButtonText, 
                  { 
                    color: callName.trim() && callDate.trim() && callTime.trim() ? 
                      colorScheme === 'dark' ? colors.card : 'white' : 
                      colors.secondaryText 
                  }
                ]}
              >
                Подтвердить звонок
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      <CapsuleMenu />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  profileCard: {
    borderRadius: 16,
    marginHorizontal: 8,
    marginTop: 16,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  statDivider: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  projectDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectStatText: {
    fontSize: 12,
    marginLeft: 4,
  },
  viewProjectButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewProjectText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  addProjectButton: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  addProjectButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyProjectsCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyProjectsText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  setupCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 10,
  },
  setupCallText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
}); 