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

interface TagCreatorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (tag: string) => void;
}

export default function TagCreator({ visible, onClose, onSelect }: TagCreatorProps) {
  const colorScheme = useColorScheme();
  const isDarkMode = useTodoStore((state) => state.isDarkMode);
  const colors = Colors[isDarkMode ? 'dark' : 'light'];
  
  const [newTag, setNewTag] = useState('');
  
  const customTags = useTodoStore((state) => state.customTags);
  const addCustomTag = useTodoStore((state) => state.addCustomTag);
  const deleteCustomTag = useTodoStore((state) => state.deleteCustomTag);
  
  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (!trimmedTag) {
      Alert.alert('Error', 'Tag name cannot be empty');
      return;
    }
    
    if (customTags.includes(trimmedTag)) {
      Alert.alert('Error', 'Tag already exists');
      return;
    }
    
    addCustomTag(trimmedTag);
    setNewTag('');
    onSelect(trimmedTag);
  };
  
  const handleSelectTag = (tag: string) => {
    onSelect(tag);
    onClose();
  };
  
  const handleDeleteTag = (tag: string) => {
    Alert.alert(
      'Delete Tag',
      `Are you sure you want to delete the tag "${tag}"? It will be removed from all tasks.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteCustomTag(tag)
        }
      ]
    );
  };
  
  const renderItem = ({ item }: { item: string }) => (
    <View style={styles.tagItem}>
      <TouchableOpacity 
        style={styles.tagButton} 
        onPress={() => handleSelectTag(item)}
      >
        <Text style={[styles.tagText, { color: colors.text }]}>{item}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteTag(item)}
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
              Custom Tags
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
              placeholder="New tag name"
              placeholderTextColor={colors.gray}
              value={newTag}
              onChangeText={setNewTag}
            />
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleAddTag}
            >
              <MaterialIcons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Your Tags
          </Text>
          
          {customTags.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={{ color: colors.secondaryText }}>
                No custom tags yet. Create your first tag above.
              </Text>
            </View>
          ) : (
            <FlatList
              data={customTags}
              renderItem={renderItem}
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
    maxHeight: 300,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tagButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  tagText: {
    fontSize: 14,
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