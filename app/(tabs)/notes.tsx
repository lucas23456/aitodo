import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTodoStore, Note } from '@/store/todoStore';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import FloatingActionButton from '@/components/FloatingActionButton';
import CapsuleMenu from '@/components/CapsuleMenu';

const NoteItem = ({
  note,
  onPress,
  onDelete
}: {
  note: Note,
  onPress: (note: Note) => void,
  onDelete: (noteId: string) => void
}) => {
  const colorScheme = useColorScheme();
  const isDarkMode = useTodoStore((state) => state.isDarkMode);
  const colors = Colors[isDarkMode ? 'dark' : 'light'];

  const date = new Date(note.updatedAt);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <TouchableOpacity
      style={[
        styles.noteItem,
        {
          backgroundColor: colors.card,
          borderColor: note.category ? colors.primary : colors.border,
          borderLeftWidth: note.category ? 4 : 1
        }
      ]}
      onPress={() => onPress(note)}
    >
      <View style={styles.noteHeader}>
        <Text style={[styles.noteTitle, { color: colors.text }]} numberOfLines={1}>
          {note.title || 'Untitled Note'}
        </Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(note.id)}
        >
          <MaterialIcons name="delete" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.noteContent, { color: colors.text }]} numberOfLines={2}>
        {note.content || 'No content'}
      </Text>

      <View style={styles.noteFooter}>
        <Text style={[styles.noteDate, { color: colors.text }]}>
          {formattedDate}
        </Text>

        {note.audioUri && (
          <MaterialIcons name="mic" size={16} color={colors.primary} style={styles.audioIcon} />
        )}

        {note.tags && note.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {note.tags.slice(0, 2).map((tag, index) => (
              <View
                key={index}
                style={[styles.tagPill, { backgroundColor: colors.primary + '40' }]}
              >
                <Text style={[styles.tagText, { color: colors.primary }]}>
                  {tag}
                </Text>
              </View>
            ))}
            {note.tags.length > 2 && (
              <Text style={[styles.moreTag, { color: colors.text }]}>
                +{note.tags.length - 2}
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function NotesScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = useTodoStore((state) => state.isDarkMode);
  const colors = Colors[isDarkMode ? 'dark' : 'light'];
  const router = useRouter();

  const notes = useTodoStore((state) => state.notes);
  const addNote = useTodoStore((state) => state.addNote);
  const updateNote = useTodoStore((state) => state.updateNote);
  const deleteNote = useTodoStore((state) => state.deleteNote);

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Sound playback
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Filter notes based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredNotes(notes);
    } else {
      const filtered = notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredNotes(filtered);
    }
  }, [searchQuery, notes]);

  // Request audio recording permissions
  useEffect(() => {
    const getPermissions = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Microphone Access',
            'Permission to use microphone is required for voice recording.'
          );
        }
      } catch (error) {
        console.error('Error requesting permissions:', error);
      }
    };

    getPermissions();
  }, []);

  // Clean up any resources on component unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [sound, recording]);

  const handleNotePress = (note: Note) => {
    setSelectedNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setAudioUri(note.audioUri);
    setSelectedTags(note.tags || []);
    setSelectedCategory(note.category || '');
    setIsModalVisible(true);
  };

  const handleCreateNote = () => {
    setSelectedNote(null);
    setNoteTitle('');
    setNoteContent('');
    setAudioUri(undefined);
    setSelectedTags([]);
    setSelectedCategory('');
    setIsModalVisible(true);
  };

  const handleDeleteNote = (noteId: string) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteNote(noteId) }
      ]
    );
  };

  const handleSaveNote = () => {
    if (!noteTitle.trim() && !noteContent.trim()) {
      Alert.alert('Error', 'Note title or content is required');
      return;
    }

    if (selectedNote) {
      // Update existing note
      updateNote({
        ...selectedNote,
        title: noteTitle,
        content: noteContent,
        tags: selectedTags,
        category: selectedCategory,
        audioUri
      });
    } else {
      // Create new note
      addNote({
        title: noteTitle,
        content: noteContent,
        tags: selectedTags,
        category: selectedCategory,
        audioUri
      });
    }

    setIsModalVisible(false);
  };

  const startRecording = async () => {
    try {
      // Unload any existing recording
      if (recording) {
        await recording.stopAndUnloadAsync();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) {
        setAudioUri(uri);
        // Now we can transcribe the audio
        await transcribeAudio(uri);
      }
      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const playRecording = async () => {
    if (!audioUri) return;

    try {
      // If sound is already loaded, just play it
      if (sound) {
        await sound.playAsync();
        setIsPlaying(true);
        return;
      }

      // Otherwise load and play
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri }
      );

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && !status.isPlaying && status.didJustFinish) {
          setIsPlaying(false);
        }
      });

      setSound(newSound);
      await newSound.playAsync();
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to play recording:', error);
      Alert.alert('Error', 'Failed to play recording');
    }
  };

  const stopPlayback = async () => {
    if (!sound) return;

    try {
      await sound.stopAsync();
      setIsPlaying(false);
    } catch (error) {
      console.error('Failed to stop playback:', error);
    }
  };

  const transcribeAudio = async (uri: string) => {
    setIsProcessing(true);

    // In a real application, this would connect to a speech-to-text service
    // For this example, we'll simulate transcription with a delay
    setTimeout(() => {
      // If there's existing content, add a line break before the transcription
      const prefix = noteContent ? noteContent + '\n\n[Transcription]:\n' : '';
      setNoteContent(prefix + "This is a simulated transcription of the audio recording. In a real application, this would be the result from a speech-to-text service.");
      setIsProcessing(false);
    }, 2000);

    // In a production app, you would implement actual transcription:
    // 1. Send the audio file to a service like Google Cloud Speech-to-Text or AWS Transcribe
    // 2. Receive the transcription and update the note content
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Notes</Text>
        <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
          <MaterialIcons name="search" size={24} color={colors.text} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search notes..."
            placeholderTextColor={colors.text + '80'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {notes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="note" size={64} color={colors.primary + '80'} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No notes yet. Tap the + button to create your first note.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NoteItem
              note={item}
              onPress={handleNotePress}
              onDelete={handleDeleteNote}
            />
          )}
          contentContainerStyle={styles.notesList}
        />
      )}

      <FloatingActionButton
        onPress={handleCreateNote}
      />

      <CapsuleMenu />

      {/* Note Edit Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {selectedNote ? 'Edit Note' : 'New Note'}
            </Text>
            <TouchableOpacity onPress={handleSaveNote}>
              <Text style={[styles.saveButton, { color: colors.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <TextInput
              style={[styles.titleInput, { color: colors.text }]}
              placeholder="Note title"
              placeholderTextColor={colors.text + '80'}
              value={noteTitle}
              onChangeText={setNoteTitle}
            />

            {/* Voice Recording Controls */}
            <View style={styles.recordingContainer}>
              {isProcessing ? (
                <View style={styles.processingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.processingText, { color: colors.text }]}>
                    Transcribing audio...
                  </Text>
                </View>
              ) : (
                <>
                  {isRecording ? (
                    <TouchableOpacity
                      style={[styles.recordButton, { backgroundColor: colors.error }]}
                      onPress={stopRecording}
                    >
                      <MaterialIcons name="stop" size={32} color="white" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.recordButton, { backgroundColor: colors.primary }]}
                      onPress={startRecording}
                    >
                      <MaterialIcons name="mic" size={32} color="white" />
                    </TouchableOpacity>
                  )}

                  {audioUri && (
                    <View style={styles.audioPlayerContainer}>
                      {isPlaying ? (
                        <TouchableOpacity
                          style={styles.playButton}
                          onPress={stopPlayback}
                        >
                          <MaterialIcons name="stop" size={24} color={colors.primary} />
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.playButton}
                          onPress={playRecording}
                        >
                          <MaterialIcons name="play-arrow" size={24} color={colors.primary} />
                        </TouchableOpacity>
                      )}
                      <Text style={[styles.audioText, { color: colors.text }]}>
                        {isPlaying ? 'Playing audio...' : 'Play recorded audio'}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>

            <TextInput
              style={[styles.contentInput, { color: colors.text, backgroundColor: colors.card }]}
              placeholder="Note content"
              placeholderTextColor={colors.text + '80'}
              multiline
              textAlignVertical="top"
              value={noteContent}
              onChangeText={setNoteContent}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  notesList: {
    padding: 16,
  },
  noteItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  noteContent: {
    fontSize: 14,
    marginBottom: 12,
  },
  noteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  audioIcon: {
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginLeft: 'auto',
  },
  tagPill: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 4,
  },
  tagText: {
    fontSize: 12,
  },
  moreTag: {
    fontSize: 12,
    marginLeft: 4,
  },
  deleteButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    borderRadius: 12,
    padding: 12,
    minHeight: 200,
  },
  recordingContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  audioPlayerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
  },
  audioText: {
    fontSize: 14,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  processingText: {
    marginLeft: 8,
    fontSize: 14,
  },
}); 