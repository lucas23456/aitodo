import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { addDays, format } from 'date-fns';

interface DateTimePickerAltProps {
  value: Date;
  mode: 'date' | 'time';
  onChange: (event: any, date?: Date) => void;
  display?: string;
  minimumDate?: Date;
}

const DateTimePickerAlt: React.FC<DateTimePickerAltProps> = ({
  value,
  mode,
  onChange,
  minimumDate,
}) => {
  const handleSelect = (days: number) => {
    const newDate = addDays(new Date(), days);
    onChange({ type: 'set' }, newDate);
  };

  const handleTimeSelect = (hours: number, minutes: number) => {
    const newDate = new Date();
    newDate.setHours(hours, minutes, 0, 0);
    onChange({ type: 'set' }, newDate);
  };

  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={true}
      onRequestClose={() => onChange({ type: 'dismissed' }, undefined)}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>
            Select {mode === 'date' ? 'Date' : 'Time'}
          </Text>

          {mode === 'date' ? (
            <>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleSelect(0)}
              >
                <Text style={styles.optionText}>Today</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleSelect(1)}
              >
                <Text style={styles.optionText}>Tomorrow</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleSelect(7)}
              >
                <Text style={styles.optionText}>In a week</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleSelect(30)}
              >
                <Text style={styles.optionText}>In a month</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleTimeSelect(9, 0)}
              >
                <Text style={styles.optionText}>9:00 AM</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleTimeSelect(12, 0)}
              >
                <Text style={styles.optionText}>12:00 PM</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleTimeSelect(15, 0)}
              >
                <Text style={styles.optionText}>3:00 PM</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleTimeSelect(18, 0)}
              >
                <Text style={styles.optionText}>6:00 PM</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.optionButton, styles.cancelButton]}
            onPress={() => onChange({ type: 'dismissed' }, undefined)}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  optionButton: {
    width: '100%',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 10,
    borderBottomWidth: 0,
  },
  cancelText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default DateTimePickerAlt; 