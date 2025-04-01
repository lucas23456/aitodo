import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { useTodoStore } from '../store/todoStore';
import { useColorScheme } from './useColorScheme';
import { categoryColors } from '../constants/Colors';

interface CategoryCreatorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (category: string) => void;
}

export default function CategoryCreator({ visible, onClose, onSelect }: CategoryCreatorProps) {
  const colorScheme = useColorScheme();
  const isDarkMode = useTodoStore((state) => state.isDarkMode);
  const colors = Colors[isDarkMode ? 'dark' : 'light'];
  
  const [newCategory, setNewCategory] = useState('');
  
  const customCategories = useTodoStore((state) => state.customCategories);
  const addCustomCategory = useTodoStore((state) => state.addCustomCategory);
  const deleteCustomCategory = useTodoStore((state) => state.deleteCustomCategory);
  
  // Get all predefined categories from constants
  const predefinedCategories = Object.keys(categoryColors);
  
  const handleAddCategory = () => {
    const trimmedCategory = newCategory.trim();
    if (!trimmedCategory) {
      Alert.alert('Error', 'Category name cannot be empty');
      return;
    }
    
    if (predefinedCategories.includes(trimmedCategory) || customCategories.includes(trimmedCategory)) {
      Alert.alert('Error', 'Category already exists');
      return;
    }
    
    addCustomCategory(trimmedCategory);
    setNewCategory('');
    onSelect(trimmedCategory);
  };
  
  const handleSelectCategory = (category: string) => {
    onSelect(category);
    onClose();
  };
  
  const handleDeleteCategory = (category: string) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete the category "${category}"? Tasks with this category will become uncategorized.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteCustomCategory(category)
        }
      ]
    );
  };
  
  const renderPredefinedCategory = ({ item }: { item: string }) => (
    <View style={styles.categoryItem}>
      <TouchableOpacity 
        style={[
          styles.categoryButton,
          { borderLeftColor: categoryColors[item as keyof typeof categoryColors] || '#777777' }
        ]} 
        onPress={() => handleSelectCategory(item)}
      >
        <Text style={[styles.categoryText, { color: colors.text }]}>{item}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCustomCategory = ({ item }: { item: string }) => (
    <View style={styles.categoryItem}>
      <TouchableOpacity 
        style={[styles.categoryButton, { borderLeftColor: '#777777' }]} 
        onPress={() => handleSelectCategory(item)}
      >
        <Text style={[styles.categoryText, { color: colors.text }]}>{item}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteCategory(item)}
      >
        <MaterialIcons name="close" size={18} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, { backgroundColor: colors.card }]}>
          <View style={styles.headerContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              Categories
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                { 
                  color: colors.text,
                  backgroundColor: colorScheme === 'dark' ? colors.lightGray : '#F0F0F5',
                  borderColor: colors.border
                }
              ]}
              placeholder="New category name"
              placeholderTextColor={colors.gray}
              value={newCategory}
              onChangeText={setNewCategory}
            />
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleAddCategory}
            >
              <MaterialIcons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Predefined Categories
          </Text>
          
          <FlatList
            data={predefinedCategories}
            renderItem={renderPredefinedCategory}
            keyExtractor={(item) => item}
            style={styles.list}
          />
          
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>
            Your Custom Categories
          </Text>
          
          {customCategories.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={{ color: colors.secondaryText }}>
                No custom categories yet. Create your first category above.
              </Text>
            </View>
          ) : (
            <FlatList
              data={customCategories}
              renderItem={renderCustomCategory}
              keyExtractor={(item) => item}
              style={styles.list}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalView: {
    width: '100%',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '80%',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  list: {
    maxHeight: 150,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    borderLeftWidth: 5,
  },
  categoryText: {
    fontSize: 14,
    marginLeft: 5,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  }
}); 