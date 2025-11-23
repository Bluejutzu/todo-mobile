import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { Button } from './Button';

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  label?: string;
  placeholder?: string;
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'Select date',
}: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value || new Date());
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const themeColors = getThemeColors(theme);

  const handleConfirm = () => {
    onChange(tempDate);
    setShowPicker(false);
  };

  const handleClear = () => {
    onChange(undefined);
    setShowPicker(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        {label && <Text style={[styles.label, { color: themeColors.text }]}>{label}</Text>}
        <TouchableOpacity
          style={[
            styles.input,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
          onPress={() => setShowPicker(true)}
        >
          <Text
            style={[
              styles.inputText,
              {
                color: value ? themeColors.text : themeColors.textSecondary,
              },
            ]}
          >
            {value ? formatDate(value) : placeholder}
          </Text>
        </TouchableOpacity>

        <Modal visible={showPicker} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: themeColors.text }]}>Select Date</Text>
              </View>

              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={(_, selectedDate) => {
                  if (selectedDate) setTempDate(selectedDate);
                }}
                textColor={themeColors.text}
              />

              <View style={styles.modalActions}>
                <Button
                  title="Clear"
                  onPress={handleClear}
                  variant="outline"
                  style={styles.modalButton}
                />
                <Button
                  title="Confirm"
                  onPress={handleConfirm}
                  variant="primary"
                  style={styles.modalButton}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Android
  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: themeColors.text }]}>{label}</Text>}
      <TouchableOpacity
        style={[
          styles.input,
          {
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
          },
        ]}
        onPress={() => setShowPicker(true)}
      >
        <Text
          style={[
            styles.inputText,
            {
              color: value ? themeColors.text : themeColors.textSecondary,
            },
          ]}
        >
          {value ? formatDate(value) : placeholder}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) onChange(selectedDate);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  input: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
  },
  inputText: {
    ...typography.body,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  modalHeader: {
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h3,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
  },
});
