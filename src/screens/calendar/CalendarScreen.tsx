import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoCalendar from 'expo-calendar';
import { Card } from '../../components/common/Card';
import { useTodoStore } from '../../stores/todoStore';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';

export function CalendarScreen() {
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const colors = getThemeColors(theme);
  const todos = useTodoStore(state => state.todos);

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [syncing, setSyncing] = useState(false);

  // Group todos by date
  const markedDates = useMemo(() => {
    const marked: any = {};

    todos.forEach(todo => {
      if (todo.dueDate) {
        const dateStr = new Date(todo.dueDate).toISOString().split('T')[0];
        if (!marked[dateStr]) {
          marked[dateStr] = {
            marked: true,
            dots: [],
          };
        }
        marked[dateStr].dots.push({
          color: todo.completed ? colors.success : colors.primary,
        });
      }
    });

    // Highlight selected date
    if (selectedDate && marked[selectedDate]) {
      marked[selectedDate].selected = true;
      marked[selectedDate].selectedColor = colors.primary;
    } else if (selectedDate) {
      marked[selectedDate] = {
        selected: true,
        selectedColor: colors.primary,
      };
    }

    return marked;
  }, [todos, selectedDate, colors]);

  // Get todos for selected date
  const todosForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return todos.filter(todo => {
      if (!todo.dueDate) return false;
      const todoDate = new Date(todo.dueDate).toISOString().split('T')[0];
      return todoDate === selectedDate;
    });
  }, [todos, selectedDate]);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const handleSyncToCalendar = async () => {
    try {
      setSyncing(true);

      // Request calendar permissions
      const { status } = await ExpoCalendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Calendar permission is required to sync todos');
        setSyncing(false);
        return;
      }

      // Get default calendar
      const calendars = await ExpoCalendar.getCalendarsAsync(ExpoCalendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(cal => cal.allowsModifications) || calendars[0];

      if (!defaultCalendar) {
        Alert.alert('Error', 'No calendar found');
        setSyncing(false);
        return;
      }

      // Sync todos with due dates
      let syncedCount = 0;
      for (const todo of todos) {
        if (todo.dueDate && !todo.completed) {
          const startDate = new Date(todo.dueDate);
          const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

          await ExpoCalendar.createEventAsync(defaultCalendar.id, {
            title: todo.title,
            notes: todo.description,
            startDate,
            endDate,
            timeZone: 'UTC',
          });
          syncedCount++;
        }
      }

      Alert.alert('Success', `Synced ${syncedCount} todos to your calendar`);
      setSyncing(false);
    } catch (error) {
      console.error('Calendar sync error:', error);
      Alert.alert('Error', 'Failed to sync to calendar');
      setSyncing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Calendar</Text>
        <TouchableOpacity onPress={handleSyncToCalendar} disabled={syncing}>
          <Ionicons name="sync" size={24} color={syncing ? colors.textSecondary : colors.primary} />
        </TouchableOpacity>
      </View>

      <Calendar
        markedDates={markedDates}
        onDayPress={handleDayPress}
        markingType="multi-dot"
        theme={{
          backgroundColor: colors.background,
          calendarBackground: colors.background,
          textSectionTitleColor: colors.textSecondary,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: colors.background,
          todayTextColor: colors.primary,
          dayTextColor: colors.text,
          textDisabledColor: colors.textSecondary,
          monthTextColor: colors.text,
          arrowColor: colors.primary,
        }}
      />

      <ScrollView style={styles.todoList}>
        {selectedDate && (
          <View style={styles.dateHeader}>
            <Text style={[styles.dateTitle, { color: colors.text }]}>
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <Text style={[styles.todoCount, { color: colors.textSecondary }]}>
              {todosForSelectedDate.length} {todosForSelectedDate.length === 1 ? 'todo' : 'todos'}
            </Text>
          </View>
        )}

        {todosForSelectedDate.length > 0 ? (
          todosForSelectedDate.map(todo => (
            <Card key={todo.id} style={styles.todoCard}>
              <View style={styles.todoHeader}>
                <View style={styles.todoTitleRow}>
                  <Ionicons
                    name={todo.completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={todo.completed ? colors.success : colors.primary}
                  />
                  <Text
                    style={[
                      styles.todoTitle,
                      { color: colors.text },
                      todo.completed && styles.completedTodo,
                    ]}
                  >
                    {todo.title}
                  </Text>
                </View>
                {todo.priority && (
                  <View
                    style={[
                      styles.priorityBadge,
                      {
                        backgroundColor:
                          todo.priority === 'high'
                            ? colors.error + '20'
                            : todo.priority === 'medium'
                              ? colors.warning + '20'
                              : colors.success + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        {
                          color:
                            todo.priority === 'high'
                              ? colors.error
                              : todo.priority === 'medium'
                                ? colors.warning
                                : colors.success,
                        },
                      ]}
                    >
                      {todo.priority}
                    </Text>
                  </View>
                )}
              </View>
              {todo.description && (
                <Text style={[styles.todoDescription, { color: colors.textSecondary }]}>
                  {todo.description}
                </Text>
              )}
              {todo.category && (
                <View style={styles.categoryRow}>
                  <Ionicons name="pricetag" size={16} color={colors.textSecondary} />
                  <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                    {todo.category}
                  </Text>
                </View>
              )}
            </Card>
          ))
        ) : selectedDate ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No todos for this date
            </Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Select a date to view todos
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  todoList: {
    flex: 1,
    padding: 16,
  },
  dateHeader: {
    marginBottom: 16,
  },
  dateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  todoCount: {
    fontSize: 14,
  },
  todoCard: {
    marginBottom: 12,
  },
  todoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  todoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  completedTodo: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  todoDescription: {
    fontSize: 14,
    marginLeft: 36,
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 36,
  },
  categoryText: {
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});
