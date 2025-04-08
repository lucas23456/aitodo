import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Switch,
  Alert
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
// import DateTimePicker from '@react-native-community/datetimepicker';
import DateTimePickerAlt from '../components/DateTimePickerAlt';
import { format } from 'date-fns';
import { Picker } from '@react-native-picker/picker';
import { useTodoStore, Task } from '@/store/todoStore';
import Colors from '@/constants/Colors';
import CapsuleMenu from '@/components/CapsuleMenu';

interface TaskFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  initialTask?: Task;
}

export default function TaskFormModal({ visible, onClose, onSubmit, initialTask }: TaskFormProps) {
  const isDarkMode = useTodoStore((state) => state.isDarkMode);
  const colors = Colors[isDarkMode ? 'dark' : 'light'];
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [completed, setCompleted] = useState(false);
  
  // Reset form when modal opens with initialTask or empty form
  useEffect(() => {
    if (visible) {
      if (initialTask) {
        setTitle(initialTask.title);
        setDescription(initialTask.description || '');
        setDueDate(initialTask.dueDate ? new Date(initialTask.dueDate) : new Date());
        setCategory(initialTask.category || '');
        setPriority(initialTask.priority);
        setTags(initialTask.tags || []);
        setCompleted(initialTask.completed);
      } else {
        resetForm();
      }
    }
  }, [visible, initialTask]);
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate(new Date());
    setCategory('');
    setPriority('medium');
    setTags([]);
    setTagInput('');
    setCompleted(false);
  };
  
  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }
    
    const task = {
      title: title.trim(),
      description,
      dueDate: dueDate.toISOString(),
      category,
      priority,
      tags,
      completed
    };
    
    onSubmit(task);
    onClose();
  };
  
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  
  const removeTag = (index: number) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    setTags(newTags);
  };
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidView}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {initialTask ? 'Edit Task' : 'New Task'}
            </Text>
            <TouchableOpacity onPress={handleSubmit} style={styles.saveButton}>
              <Text style={[styles.saveButtonText, { color: colors.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
            {/* Title Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.secondaryText }]}>Title</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.titleInput,
                  { 
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border
                  }
                ]}
                value={title}
                onChangeText={setTitle}
                placeholder="Task title"
                placeholderTextColor={colors.secondaryText}
              />
            </View>
            
            {/* Description Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.secondaryText }]}>Description</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.descriptionInput,
                  { 
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border,
                    textAlignVertical: 'top'
                  }
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder="Task description (optional)"
                placeholderTextColor={colors.secondaryText}
                multiline
                numberOfLines={4}
              />
            </View>
            
            {/* Due Date Picker */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.secondaryText }]}>Due Date</Text>
              <TouchableOpacity
                style={[
                  styles.datePickerButton,
                  { 
                    backgroundColor: colors.card,
                    borderColor: colors.border
                  }
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[styles.datePickerText, { color: colors.text }]}>
                  {format(dueDate, 'EEEE, MMMM d, yyyy')}
                </Text>
                <MaterialIcons name="event" size={24} color={colors.primary} />
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePickerAlt
                  value={dueDate}
                  mode="date"
                  onChange={handleDateChange}
                />
              )}
            </View>
            
            {/* Category Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.secondaryText }]}>Category</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border
                  }
                ]}
                value={category}
                onChangeText={setCategory}
                placeholder="Category (optional)"
                placeholderTextColor={colors.secondaryText}
              />
            </View>
            
            {/* Priority Picker */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.secondaryText }]}>Priority</Text>
              <View style={[
                styles.pickerContainer,
                { 
                  backgroundColor: colors.card,
                  borderColor: colors.border
                }
              ]}>
                <Picker
                  selectedValue={priority}
                  onValueChange={(itemValue: 'low' | 'medium' | 'high') => setPriority(itemValue)}
                  style={[styles.picker, { color: colors.text }]}
                  dropdownIconColor={colors.text}
                >
                  <Picker.Item label="Low" value="low" />
                  <Picker.Item label="Medium" value="medium" />
                  <Picker.Item label="High" value="high" />
                </Picker>
              </View>
            </View>
            
            {/* Tags Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.secondaryText }]}>Tags</Text>
              <View style={[
                styles.tagsInputContainer,
                { 
                  backgroundColor: colors.card,
                  borderColor: colors.border
                }
              ]}>
                <TextInput
                  style={[styles.tagInput, { color: colors.text }]}
                  value={tagInput}
                  onChangeText={setTagInput}
                  placeholder="Add tags..."
                  placeholderTextColor={colors.secondaryText}
                  onSubmitEditing={addTag}
                />
                <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
                  <MaterialIcons name="add" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.tagsContainer}>
                {tags.map((tag, index) => (
                  <View 
                    key={index} 
                    style={[styles.tag, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.tagText}>{tag}</Text>
                    <TouchableOpacity 
                      style={styles.removeTagButton} 
                      onPress={() => removeTag(index)}
                    >
                      <MaterialIcons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
            
            {/* Completed Toggle */}
            {initialTask && (
              <View style={styles.inputGroup}>
                <View style={styles.switchContainer}>
                  <Text style={[styles.label, { color: colors.secondaryText }]}>
                    Completed
                  </Text>
                  <Switch
                    value={completed}
                    onValueChange={setCompleted}
                    trackColor={{ false: colors.lightGray, true: colors.success }}
                    thumbColor={colors.card}
                  />
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
        
        <CapsuleMenu />
      </View>
    </Modal>
  );
}

export function TaskFormRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  const isDarkMode = useTodoStore((state) => state.isDarkMode);
  const tasks = useTodoStore((state) => state.tasks);
  const addTask = useTodoStore((state) => state.addTask);
  const updateTask = useTodoStore((state) => state.updateTask);
  
  // Find the task if we're editing
  const task = params.id ? tasks.find(t => t.id === params.id) : undefined;
  
  const handleSubmit = (formData: Omit<Task, 'id' | 'createdAt'>) => {
    if (task) {
      // Update existing task
      updateTask({
        ...task,
        ...formData
      });
    } else {
      // Create new task
      addTask(formData);
    }
    
    router.back();
  };
  
  return (
    <View style={styles.routeContainer}>
      <TaskFormModal
        visible={true}
        onClose={() => router.back()}
        onSubmit={handleSubmit}
        initialTask={task}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 16,
    paddingBottom: 100,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '500',
  },
  descriptionInput: {
    minHeight: 100,
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  datePickerText: {
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  tagsInputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  tagInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  addTagButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'white',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: 'black',
    fontSize: 14,
    fontWeight: '500',
  },
  removeTagButton: {
    marginLeft: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeContainer: {
    flex: 1,
  },
}); 