import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Task } from '../store/todoStore';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import Colors from '../constants/Colors';
import { categoryColors, priorityColors, tagColors } from '../constants/Colors';
import { useColorScheme } from './useColorScheme';

type TaskFormProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  initialTask?: Task;
};

// Available categories
const CATEGORIES = Object.keys(categoryColors);

// Available tags
const TAGS = Object.keys(tagColors);

// Priority levels
const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

// CategoryButton component
const CategoryButton = ({ cat, selectedCategory, onPress }: { cat: string, selectedCategory: string, onPress: (cat: string) => void }) => {
  const colorScheme = useColorScheme();
  return (
    <TouchableOpacity
      key={cat}
      style={[
        styles.categoryButton,
        { 
          backgroundColor: selectedCategory === cat 
            ? categoryColors[cat as keyof typeof categoryColors] 
            : 'transparent',
          borderColor: categoryColors[cat as keyof typeof categoryColors],
          opacity: selectedCategory === cat ? 0.9 : 0.7
        }
      ]}
      onPress={() => onPress(cat)}
    >
      <Text
        style={[
          styles.categoryText,
          { 
            color: selectedCategory === cat 
              ? colorScheme === 'dark' ? '#000' : 'white'
              : categoryColors[cat as keyof typeof categoryColors] 
          }
        ]}
      >
        {cat}
      </Text>
    </TouchableOpacity>
  );
};

// PriorityButton component
const PriorityButton = ({ priority, selectedPriority, onPress }: { priority: { value: 'low' | 'medium' | 'high', label: string }, selectedPriority: string, onPress: (value: 'low' | 'medium' | 'high') => void }) => {
  const colorScheme = useColorScheme();
  return (
    <TouchableOpacity
      key={priority.value}
      style={[
        styles.priorityButton,
        { 
          backgroundColor: selectedPriority === priority.value 
            ? priorityColors[priority.value] 
            : 'transparent',
          borderColor: priorityColors[priority.value],
          opacity: selectedPriority === priority.value ? 0.9 : 0.7
        }
      ]}
      onPress={() => onPress(priority.value)}
    >
      <Text
        style={[
          styles.priorityText,
          { 
            color: selectedPriority === priority.value
              ? colorScheme === 'dark' ? '#000' : 'white'
              : priorityColors[priority.value] 
          }
        ]}
      >
        {priority.label}
      </Text>
    </TouchableOpacity>
  );
};

// TagButton component
const TagButton = ({ tag, selectedTags, onPress }: { tag: string, selectedTags: string[], onPress: (tag: string) => void }) => {
  const colorScheme = useColorScheme();
  const isSelected = selectedTags.includes(tag);
  
  return (
    <TouchableOpacity
      key={tag}
      style={[
        styles.tagButton,
        { 
          backgroundColor: isSelected 
            ? tagColors[tag as keyof typeof tagColors] 
            : 'transparent',
          borderColor: tagColors[tag as keyof typeof tagColors],
          opacity: isSelected ? 0.9 : 0.7
        }
      ]}
      onPress={() => onPress(tag)}
    >
      <Text
        style={[
          styles.tagText,
          { 
            color: isSelected
              ? colorScheme === 'dark' ? '#000' : 'white'
              : tagColors[tag as keyof typeof tagColors] 
          }
        ]}
      >
        {tag}
      </Text>
    </TouchableOpacity>
  );
};

export default function TaskForm({ visible, onClose, onSubmit, initialTask }: TaskFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [tags, setTags] = useState<string[]>([]);
  
  // Reset form when initialTask changes or modal closes
  useEffect(() => {
    if (visible) {
      if (initialTask) {
        setTitle(initialTask.title);
        setDescription(initialTask.description || '');
        setDueDate(initialTask.dueDate ? new Date(initialTask.dueDate) : null);
        setCategory(initialTask.category || '');
        setPriority(initialTask.priority || 'medium');
        setTags(initialTask.tags || []);
      } else {
        resetForm();
      }
    }
  }, [visible, initialTask]);
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate(null);
    setCategory('');
    setPriority('medium');
    setTags([]);
  };
  
  const handleSubmit = () => {
    if (!title.trim()) return;
    
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate ? format(dueDate, "yyyy-MM-dd'T'HH:mm:ss") : '',
      completed: initialTask ? initialTask.completed : false,
      category,
      priority,
      tags,
    });
    
    resetForm();
    onClose();
  };
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };
  
  const removeDueDate = () => {
    setDueDate(null);
  };

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredView}
      >
        <View style={[styles.modalView, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {initialTask ? 'Edit Task' : 'New Task'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={colors.gray} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.formContainer}>
            {/* Title */}
            <Text style={[styles.label, { color: colors.text }]}>Title</Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  color: colors.text,
                  backgroundColor: colorScheme === 'dark' ? colors.lightGray : '#F0F0F5',
                  borderColor: colors.border 
                }
              ]}
              placeholder="Task title"
              placeholderTextColor={colors.gray}
              value={title}
              onChangeText={setTitle}
              autoFocus
            />
            
            {/* Description */}
            <Text style={[styles.label, { color: colors.text }]}>Description (optional)</Text>
            <TextInput
              style={[
                styles.input, 
                styles.textArea, 
                { 
                  color: colors.text,
                  backgroundColor: colorScheme === 'dark' ? colors.lightGray : '#F0F0F5',
                  borderColor: colors.border 
                }
              ]}
              placeholder="Add details about your task"
              placeholderTextColor={colors.gray}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            {/* Categories */}
            <Text style={[styles.label, { color: colors.text }]}>Category</Text>
            <View style={styles.categoriesContainer}>
              {CATEGORIES.map((cat) => (
                <CategoryButton
                  key={cat}
                  cat={cat}
                  selectedCategory={category}
                  onPress={setCategory}
                />
              ))}
            </View>
            
            {/* Priority */}
            <Text style={[styles.label, { color: colors.text }]}>Priority</Text>
            <View style={styles.priorityContainer}>
              {PRIORITIES.map((p) => (
                <PriorityButton
                  key={p.value}
                  priority={p as { value: 'low' | 'medium' | 'high', label: string }}
                  selectedPriority={priority}
                  onPress={setPriority}
                />
              ))}
            </View>
            
            {/* Tags */}
            <Text style={[styles.label, { color: colors.text }]}>Tags</Text>
            <View style={styles.tagsContainer}>
              {TAGS.map((tag) => (
                <TagButton
                  key={tag}
                  tag={tag}
                  selectedTags={tags}
                  onPress={toggleTag}
                />
              ))}
            </View>
            
            {/* Due Date */}
            <Text style={[styles.label, { color: colors.text }]}>Due Date (optional)</Text>
            
            {dueDate ? (
              <View style={styles.dateContainer}>
                <Text style={[styles.dateText, { color: colors.text }]}>
                  {format(dueDate, 'EEEE, MMMM d, yyyy')}
                </Text>
                <TouchableOpacity onPress={removeDueDate}>
                  <MaterialIcons name="close" size={20} color={colors.gray} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={[
                  styles.dateButton, 
                  { 
                    backgroundColor: colorScheme === 'dark' ? colors.lightGray : '#F0F0F5',
                    borderColor: colors.border 
                  }
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <MaterialIcons name="calendar-today" size={20} color={colors.gray} />
                <Text style={[styles.dateButtonText, { color: colors.gray }]}>
                  Add due date
                </Text>
              </TouchableOpacity>
            )}
            
            {showDatePicker && (
              <DateTimePicker
                value={dueDate || new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
          </ScrollView>
          
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: title.trim() ? colors.primary : colors.lightGray }
              ]}
              onPress={handleSubmit}
              disabled={!title.trim()}
            >
              <Text style={[
                styles.buttonText, 
                { color: title.trim() ? 'white' : colors.gray }
              ]}>
                {initialTask ? 'Update Task' : 'Add Task'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '100%',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    width: '100%',
  },
  label: {
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
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  dateButtonText: {
    fontSize: 16,
    marginLeft: 8,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryButton: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 2,
  },
  categoryText: {
    fontWeight: '600',
    fontSize: 14,
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priorityButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderWidth: 2,
  },
  priorityText: {
    fontWeight: '600',
    fontSize: 14,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tagButton: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 2,
  },
  tagText: {
    fontWeight: '600',
    fontSize: 12,
  },
  footer: {
    width: '100%',
    marginTop: 16,
  },
  button: {
    borderRadius: 8,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 