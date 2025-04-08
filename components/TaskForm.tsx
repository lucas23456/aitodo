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
  Switch,
  Button,
} from 'react-native';
import { format, addDays } from 'date-fns';
import { Task, useTodoStore } from '../store/todoStore';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import Colors from '../constants/Colors';
import { categoryColors, priorityColors, tagColors } from '../constants/Colors';
import { useColorScheme } from './useColorScheme';
import TagCreator from './TagCreator';
import CategoryCreator from './CategoryCreator';
// import DateTimePicker from '@react-native-community/datetimepicker';

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
const PRIORITIES: Array<{ value: 'low' | 'medium' | 'high', label: string, icon: any }> = [
  { value: 'low', label: 'Low', icon: 'angle-up' },
  { value: 'medium', label: 'Medium', icon: 'flag-o' },
  { value: 'high', label: 'High', icon: 'flag' },
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
  priority: { value: 'low' | 'medium' | 'high', label: string, icon: any }, 
  selectedPriority: 'low' | 'medium' | 'high', 
  onPress: (value: 'low' | 'medium' | 'high') => void 
}) => {
  const colorScheme = useColorScheme();
  const isSelected = selectedPriority === priority.value;
  const priorityColor = priorityColors[priority.value];
  
  return (
    <TouchableOpacity
      key={priority.value}
      style={[
        styles.priorityButton,
        { 
          backgroundColor: isSelected ? priorityColor : 'transparent',
          borderColor: priorityColor,
          borderWidth: 1.5,
          opacity: isSelected ? 1 : 0.7,
          shadowColor: isSelected ? priorityColor : 'transparent',
          shadowOffset: { width: 0, height: isSelected ? 2 : 0 },
          shadowOpacity: isSelected ? 0.4 : 0,
          shadowRadius: isSelected ? 3 : 0,
          elevation: isSelected ? 3 : 0
        }
      ]}
      onPress={() => onPress(priority.value)}
    >
      <FontAwesome 
        name={priority.icon} 
        size={18} 
        color={isSelected ? (colorScheme === 'dark' ? '#000' : 'white') : priorityColor} 
        style={styles.priorityIcon}
      />
      <Text
        style={[
          styles.priorityText,
          { 
            color: isSelected
              ? colorScheme === 'dark' ? '#000' : 'white'
              : priorityColor,
            fontWeight: isSelected ? '700' : '500'
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
  
  // Новые состояния для даты и времени
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [timeEnabled, setTimeEnabled] = useState(false);
  const [dueTime, setDueTime] = useState('12:00');
  
  // Состояния для повторяемости
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatType, setRepeatType] = useState<'daily' | 'weekly' | 'monthly' | 'none'>('none');
  const [repeatInterval, setRepeatInterval] = useState(1);
  const [repeatEndDate, setRepeatEndDate] = useState<Date | null>(null);
  const [showRepeatEndDateModal, setShowRepeatEndDateModal] = useState(false);
  
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
        
        // Установка даты и времени
        if (initialTask.dueDate) {
          setDueDate(new Date(initialTask.dueDate));
        }
        
        if (initialTask.dueTime) {
          setTimeEnabled(true);
          setDueTime(initialTask.dueTime);
        } else {
          setTimeEnabled(false);
          setDueTime('12:00');
        }
        
        // Установка повторяемости
        if (initialTask.repeat && initialTask.repeat.type !== 'none') {
          setRepeatEnabled(true);
          setRepeatType(initialTask.repeat.type);
          setRepeatInterval(initialTask.repeat.interval);
          if (initialTask.repeat.endDate) {
            setRepeatEndDate(new Date(initialTask.repeat.endDate));
          } else {
            setRepeatEndDate(null);
          }
        } else {
          setRepeatEnabled(false);
          setRepeatType('none');
          setRepeatInterval(1);
          setRepeatEndDate(null);
        }
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
    
    // Сбрасываем новые поля
    setDueDate(new Date());
    setTimeEnabled(false);
    setDueTime('12:00');
    setRepeatEnabled(false);
    setRepeatType('none');
    setRepeatInterval(1);
    setRepeatEndDate(null);
  };
  
  // Replace date picker methods
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePickerModal(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePickerModal(false);
    if (selectedTime) {
      setDueTime(format(selectedTime, 'HH:mm'));
    }
  };

  const handleRepeatEndDateChange = (event: any, selectedDate?: Date) => {
    setShowRepeatEndDateModal(false);
    if (selectedDate) {
      setRepeatEndDate(selectedDate);
    }
  };

  const handleSelectDate = (offset: number) => {
    const newDate = addDays(new Date(), offset);
    setDueDate(newDate);
    setShowDatePickerModal(false);
  };

  const handleSelectTime = (hours: number, minutes: number) => {
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    setDueTime(timeString);
    setShowTimePickerModal(false);
  };

  const handleSelectEndDate = (offset: number) => {
    const newDate = addDays(new Date(), offset);
    setRepeatEndDate(newDate);
    setShowRepeatEndDateModal(false);
  };

  const toggleTimeEnabled = (value: boolean) => {
    setTimeEnabled(value);
    // Если время отключено, сбрасываем его значение
    if (!value) {
      setDueTime('12:00');
    }
  };
  
  const toggleRepeatEnabled = (value: boolean) => {
    setRepeatEnabled(value);
    // Если повторение отключено, сбрасываем его значения
    if (!value) {
      setRepeatType('none');
      setRepeatInterval(1);
      setRepeatEndDate(null);
    }
  };
  
  const handleSubmit = () => {
    if (!title.trim()) return;
    
    // Подготавливаем объект задачи с новыми полями
    const task: Omit<Task, 'id' | 'createdAt'> = {
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate.toISOString(),
      dueTime: timeEnabled ? dueTime : undefined,
      completed: initialTask ? initialTask.completed : false,
      category,
      priority,
      tags,
    };
    
    // Добавляем поле повторяемости, если включено
    if (repeatEnabled && repeatType !== 'none') {
      task.repeat = {
        type: repeatType,
        interval: repeatInterval,
        endDate: repeatEndDate ? repeatEndDate.toISOString() : undefined,
      };
    }
    
    onSubmit(task);
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
            
            {/* Due Date & Time */}
            <Text style={[styles.label, { color: colors.text }]}>Due Date</Text>
            <TouchableOpacity
              style={[
                styles.dateButton,
                { 
                  backgroundColor: colorScheme === 'dark' ? colors.lightGray : '#F0F0F5',
                  borderColor: colors.border,
                }
              ]}
              onPress={() => setShowDatePickerModal(true)}
            >
              <Text style={{ color: colors.text }}>
                {format(dueDate, 'EEEE, MMMM d, yyyy')}
              </Text>
              <MaterialIcons name="calendar-today" size={24} color={colors.primary} />
            </TouchableOpacity>
            
            {/* Time Toggle */}
            <View style={styles.switchRow}>
              <Text style={[styles.label, { color: colors.text }]}>Set Time</Text>
              <Switch
                value={timeEnabled}
                onValueChange={toggleTimeEnabled}
                trackColor={{ false: colors.gray, true: colors.primary }}
                thumbColor={timeEnabled ? colors.primary : colors.gray}
              />
            </View>

            {/* Time Picker (отображается только если timeEnabled=true) */}
            {timeEnabled && (
              <>
                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    { 
                      backgroundColor: colorScheme === 'dark' ? colors.lightGray : '#F0F0F5',
                      borderColor: colors.border,
                      marginTop: 10,
                    }
                  ]}
                  onPress={() => setShowTimePickerModal(true)}
                >
                  <Text style={{ color: colors.text }}>
                    {dueTime}
                  </Text>
                  <MaterialIcons name="access-time" size={24} color={colors.primary} />
                </TouchableOpacity>
              </>
            )}
            
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
              {allCategories.map((cat, index) => (
                <CategoryButton
                  key={`${cat}-${index}`}
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
              {allTags.map((tag, index) => (
                <TagButton
                  key={`${tag}-${index}`}
                  tag={tag}
                  selectedTags={tags}
                  onPress={toggleTag}
                />
              ))}
            </View>
            
            {/* Repeating Tasks Section */}
            <View style={styles.switchRow}>
              <Text style={[styles.label, { color: colors.text }]}>Repeating Task</Text>
              <Switch
                value={repeatEnabled}
                onValueChange={toggleRepeatEnabled}
                trackColor={{ false: colors.gray, true: colors.primary }}
                thumbColor={repeatEnabled ? colors.primary : colors.gray}
              />
            </View>
            
            {repeatEnabled && (
              <View style={styles.repeatContainer}>
                {/* Repeat Type Selector */}
                <Text style={[styles.sublabel, { color: colors.text }]}>Repeat every</Text>
                <View style={styles.repeatTypeContainer}>
                  <TextInput
                    style={[
                      styles.intervalInput,
                      { 
                        color: colors.text,
                        backgroundColor: colorScheme === 'dark' ? colors.lightGray : '#F0F0F5',
                        borderColor: colors.border,
                      }
                    ]}
                    value={repeatInterval.toString()}
                    onChangeText={(text) => {
                      const value = parseInt(text);
                      if (!isNaN(value) && value > 0) {
                        setRepeatInterval(value);
                      } else if (text === '') {
                        setRepeatInterval(1);
                      }
                    }}
                    keyboardType="numeric"
                  />
                  
                  <View style={styles.repeatTypeSelector}>
                    <TouchableOpacity
                      style={[
                        styles.repeatTypeButton,
                        { 
                          backgroundColor: repeatType === 'daily' 
                            ? colors.primary 
                            : colorScheme === 'dark' ? colors.lightGray : '#F0F0F5'
                        }
                      ]}
                      onPress={() => setRepeatType('daily')}
                    >
                      <Text style={{ 
                        color: repeatType === 'daily' ? 'white' : colors.text
                      }}>Daily</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.repeatTypeButton,
                        { 
                          backgroundColor: repeatType === 'weekly' 
                            ? colors.primary 
                            : colorScheme === 'dark' ? colors.lightGray : '#F0F0F5'
                        }
                      ]}
                      onPress={() => setRepeatType('weekly')}
                    >
                      <Text style={{ 
                        color: repeatType === 'weekly' ? 'white' : colors.text
                      }}>Weekly</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.repeatTypeButton,
                        { 
                          backgroundColor: repeatType === 'monthly' 
                            ? colors.primary 
                            : colorScheme === 'dark' ? colors.lightGray : '#F0F0F5'
                        }
                      ]}
                      onPress={() => setRepeatType('monthly')}
                    >
                      <Text style={{ 
                        color: repeatType === 'monthly' ? 'white' : colors.text
                      }}>Monthly</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Repeat End Date */}
                <View style={styles.endDateContainer}>
                  <Text style={[styles.sublabel, { color: colors.text }]}>End date (optional)</Text>
                  
                  {repeatEndDate ? (
                    <TouchableOpacity
                      style={[
                        styles.dateButton,
                        { 
                          backgroundColor: colorScheme === 'dark' ? colors.lightGray : '#F0F0F5',
                          borderColor: colors.border,
                          marginTop: 8,
                        }
                      ]}
                      onPress={() => setShowRepeatEndDateModal(true)}
                    >
                      <Text style={{ color: colors.text }}>
                        {format(repeatEndDate, 'MMMM d, yyyy')}
                      </Text>
                      <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity
                          onPress={() => setRepeatEndDate(null)}
                          style={{ marginRight: 8 }}
                        >
                          <MaterialIcons name="close" size={20} color={colors.error} />
                        </TouchableOpacity>
                        <MaterialIcons name="calendar-today" size={20} color={colors.primary} />
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.addEndDateButton,
                        { 
                          borderColor: colors.primary,
                          marginTop: 8,
                        }
                      ]}
                      onPress={() => setShowRepeatEndDateModal(true)}
                    >
                      <MaterialIcons name="add" size={20} color={colors.primary} />
                      <Text style={{ color: colors.primary, marginLeft: 8 }}>Add end date</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
            
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
    justifyContent: 'space-between',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    flex: 1,
  },
  priorityIcon: {
    marginRight: 6,
  },
  priorityText: {
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
    color: 'white',
  },
  disabledButton: {
    opacity: 0.7,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  repeatContainer: {
    marginBottom: 16,
  },
  repeatTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  intervalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 8,
  },
  repeatTypeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  repeatTypeButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 4,
  },
  endDateContainer: {
    marginBottom: 16,
  },
  addEndDateButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  sublabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
}); 