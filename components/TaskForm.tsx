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
import { Task, useTodoStore } from '../store/todoStore';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import Colors from '../constants/Colors';
import { categoryColors, priorityColors, tagColors } from '../constants/Colors';
import { useColorScheme } from './useColorScheme';
import TagCreator from './TagCreator';
import CategoryCreator from './CategoryCreator';

type TaskFormProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  initialTask?: Task;
};

// Available categories
const CATEGORIES = Object.keys(categoryColors);

// Available preset tags
const PRESET_TAGS = Object.keys(tagColors);

// Priority levels
const PRIORITIES: Array<{ value: 'low' | 'medium' | 'high', label: string }> = [
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
const PriorityButton = ({ 
  priority, 
  selectedPriority, 
  onPress 
}: { 
  priority: { value: 'low' | 'medium' | 'high', label: string }, 
  selectedPriority: 'low' | 'medium' | 'high', 
  onPress: (value: 'low' | 'medium' | 'high') => void 
}) => {
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
  
  // For custom tags that don't have predefined colors, use a default color
  const tagColorKey = tag as keyof typeof tagColors;
  const tagColor = tagColors[tagColorKey] || '#777777';
  
  return (
    <TouchableOpacity
      key={tag}
      style={[
        styles.tagButton,
        { 
          backgroundColor: isSelected 
            ? tagColor 
            : 'transparent',
          borderColor: tagColor,
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
              : tagColor 
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
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [tags, setTags] = useState<string[]>([]);
  const [showTagCreator, setShowTagCreator] = useState(false);
  const [showCategoryCreator, setShowCategoryCreator] = useState(false);
  
  // Get custom tags and categories from store
  const customTags = useTodoStore((state) => state.customTags);
  const customCategories = useTodoStore((state) => state.customCategories);
  
  // All available tags (preset + custom)
  const allTags = [...PRESET_TAGS, ...customTags];
  
  // All available categories (preset + custom)
  const allCategories = [...CATEGORIES, ...customCategories];
  
  // Reset form when initialTask changes or modal closes
  useEffect(() => {
    if (visible) {
      if (initialTask) {
        setTitle(initialTask.title);
        setDescription(initialTask.description || '');
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
    setCategory('');
    setPriority('medium');
    setTags([]);
  };
  
  const handleSubmit = () => {
    if (!title.trim()) return;
    
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      dueDate: new Date().toISOString(), // Set default current date
      completed: initialTask ? initialTask.completed : false,
      category,
      priority,
      tags,
    });
    
    resetForm();
    onClose();
  };
  
  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };
  
  const handleAddCustomTag = (tag: string) => {
    toggleTag(tag);
  };
  
  const handleAddCustomCategory = (newCategory: string) => {
    setCategory(newCategory);
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
                  borderColor: colors.border,
                }
              ]}
              placeholder="Task title"
              placeholderTextColor={colors.gray}
              value={title}
              onChangeText={setTitle}
            />
            
            {/* Description */}
            <Text style={[styles.label, { color: colors.text }]}>Description (optional)</Text>
            <TextInput
              style={[
                styles.textArea, 
                { 
                  color: colors.text,
                  backgroundColor: colorScheme === 'dark' ? colors.lightGray : '#F0F0F5',
                  borderColor: colors.border,
                }
              ]}
              placeholder="Description"
              placeholderTextColor={colors.gray}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />
            
            {/* Priority */}
            <Text style={[styles.label, { color: colors.text }]}>Priority</Text>
            <View style={styles.priorityContainer}>
              {PRIORITIES.map((p) => (
                <PriorityButton
                  key={p.value}
                  priority={p}
                  selectedPriority={priority}
                  onPress={setPriority}
                />
              ))}
            </View>
            
            {/* Categories */}
            <View style={styles.tagsHeaderContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Category</Text>
              <TouchableOpacity 
                style={styles.addTagButton}
                onPress={() => setShowCategoryCreator(true)}
              >
                <MaterialIcons name="add" size={18} color={colors.primary} />
                <Text style={[styles.addTagText, { color: colors.primary }]}>
                  New Category
                </Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
            >
              {allCategories.map((cat) => (
                <CategoryButton
                  key={cat}
                  cat={cat}
                  selectedCategory={category}
                  onPress={setCategory}
                />
              ))}
            </ScrollView>
            
            {/* Tags */}
            <View style={styles.tagsHeaderContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Tags</Text>
              <TouchableOpacity 
                style={styles.addTagButton}
                onPress={() => setShowTagCreator(true)}
              >
                <MaterialIcons name="add" size={18} color={colors.primary} />
                <Text style={[styles.addTagText, { color: colors.primary }]}>
                  New Tag
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.tagsContainer}>
              {allTags.map((tag) => (
                <TagButton
                  key={tag}
                  tag={tag}
                  selectedTags={tags}
                  onPress={toggleTag}
                />
              ))}
            </View>
            
            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary },
                !title.trim() && styles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={!title.trim()}
            >
              <Text style={styles.submitButtonText}>
                {initialTask ? 'Update Task' : 'Add Task'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      
      {/* Tag Creator Modal */}
      <TagCreator
        visible={showTagCreator}
        onClose={() => setShowTagCreator(false)}
        onSelect={handleAddCustomTag}
      />
      
      {/* Category Creator Modal */}
      <CategoryCreator
        visible={showCategoryCreator}
        onClose={() => setShowCategoryCreator(false)}
        onSelect={handleAddCustomCategory}
      />
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
  clearDateButton: {
    padding: 4,
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
  tagsHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  addTagText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  submitButton: {
    borderRadius: 8,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
}); 