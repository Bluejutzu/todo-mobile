import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../common/Input';
import { DatePicker } from '../common/DatePicker';
import { ColorPicker } from '../common/ColorPicker';
import { AILoadingIndicator } from '../ai/AILoadingIndicator';
import { useUserStore } from '../../stores/userStore';
import { useTodoStore } from '../../stores/todoStore';
import { getThemeColors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { Todo, TodoPriority } from '../../types/todo';
import type { AIConfig } from '../../types/ai';
import { aiService } from '../../services/ai';
import { SafeAreaView } from 'react-native-safe-area-context';

interface TodoModalProps {
  visible: boolean;
  todo?: Todo;
  onClose: () => void;
  onSave: (todoData: Partial<Todo>) => void;
}

const PRIORITIES: { value: TodoPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#10b981' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#ef4444' },
];

export function TodoModal({ visible, todo, onClose, onSave }: TodoModalProps) {
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const preferences = useUserStore(state => state.preferences);
  const { updatePreferences } = useUserStore();
  const themeColors = getThemeColors(theme);
  const todos = useTodoStore(state => state.todos);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('medium');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [category, setCategory] = useState('');
  const [color, setColor] = useState<string>('#6366f1');

  // AI State
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiMessage, setAiMessage] = useState('');

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description || '');
      setPriority(todo.priority);
      setDueDate(todo.dueDate);
      setCategory(todo.category || '');
      setColor(todo.color || '#6366f1');
    } else {
      // Reset for new todo
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate(undefined);
      setCategory('');
      setColor('#6366f1');
    }
    setIsAIProcessing(false);
    setAiMessage('');
  }, [todo, visible]);


  const handleImproveWithAI = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title first');
      return;
    }

    console.log('[TodoModal] Starting AI improvement...');
    setIsAIProcessing(true);
    setAiMessage('Improving todo with AI...');

    let totalTokens = 0;
    let requestsMade = 0;

    try {
      const currentTodo = { title, description, category, priority, dueDate };

      // Improve todo
      if (preferences?.ai?.todoImprovement) {
        setAiMessage('Enhancing title and description...');
        const improvementResult = await aiService.improveTodo(currentTodo, todos, {
          userApiKey: preferences?.ai?.openRouterKey,
          model: preferences?.ai?.model,
        });

        if (improvementResult.success && improvementResult.result) {
          console.log('[TodoModal] Improvement result:', improvementResult.result);
          if (improvementResult.result.title) setTitle(improvementResult.result.title);
          if (improvementResult.result.description) setDescription(improvementResult.result.description);
          if (improvementResult.tokensUsed) totalTokens += improvementResult.tokensUsed;
          requestsMade++;
        } else {
          console.error('[TodoModal] Improvement failed:', improvementResult.error);
        }
      }

      // Suggest category
      if (preferences?.ai?.autoCategory && !category) {
        setAiMessage('Suggesting category...');
        const categoryResult = await aiService.suggestCategory(currentTodo, todos, {
          userApiKey: preferences?.ai?.openRouterKey,
          model: preferences?.ai?.model,
        });

        if (categoryResult.success && categoryResult.result) {
          console.log('[TodoModal] Category suggestion:', categoryResult.result);
          setCategory(categoryResult.result.category);
          if (categoryResult.tokensUsed) totalTokens += categoryResult.tokensUsed;
          requestsMade++;
        } else {
          console.error('[TodoModal] Category suggestion failed:', categoryResult.error);
        }
      }

      // Suggest priority
      if (preferences?.ai?.prioritySuggestion) {
        setAiMessage('Analyzing priority...');
        const priorityResult = await aiService.suggestPriority(currentTodo, todos, {
          userApiKey: preferences?.ai?.openRouterKey,
          model: preferences?.ai?.model,
        });

        if (priorityResult.success && priorityResult.result) {
          console.log('[TodoModal] Priority suggestion:', priorityResult.result);
          setPriority(priorityResult.result.priority);
          if (priorityResult.tokensUsed) totalTokens += priorityResult.tokensUsed;
          requestsMade++;
        } else {
          console.error('[TodoModal] Priority suggestion failed:', priorityResult.error);
        }
      }

      // Update usage statistics
      if (requestsMade > 0 && preferences?.ai) {
        const currentAI = preferences.ai;
        updatePreferences({
          ai: {
            ...currentAI,
            requestCount: (currentAI.requestCount || 0) + requestsMade,
            totalTokensUsed: (currentAI.totalTokensUsed || 0) + totalTokens,
            lastUsed: new Date(),
          } as AIConfig,
        });
        console.log(`[TodoModal] Updated usage: +${ requestsMade } requests, +${ totalTokens } tokens`);
      }

      setAiMessage('AI improvements applied!');
      setTimeout(() => {
        setIsAIProcessing(false);
        setAiMessage('');
      }, 1500);
    } catch (error) {
      console.error('[TodoModal] AI improvement error:', error);
      Alert.alert('Error', 'Failed to improve todo with AI');
      setIsAIProcessing(false);
      setAiMessage('');
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const todoData: Partial<Todo> = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate,
      category: category.trim() || undefined,
      color,
    };

    onSave(todoData);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { color: themeColors.textSecondary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            {todo ? 'Edit Todo' : 'New Todo'}
          </Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <Text
              style={[
                styles.headerButtonText,
                styles.saveButtonText,
                {
                  color: title.trim() ? themeColors.primary : themeColors.textSecondary,
                },
              ]}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <Input
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="What needs to be done?"
            autoFocus
          />

          {/* AI Improve Button */}
          {preferences?.ai?.enabled && (
            <TouchableOpacity
              style={[styles.aiButton, { backgroundColor: themeColors.primary }]}
              onPress={handleImproveWithAI}
              disabled={isAIProcessing || !title.trim()}
              activeOpacity={0.7}
            >
              <Ionicons name="sparkles" size={18} color={themeColors.onPrimary} />
              <Text style={[styles.aiButtonText, { color: themeColors.onPrimary }]}>Improve with AI</Text>
            </TouchableOpacity>
          )}

          {/* AI Loading Indicator */}
          {isAIProcessing && <AILoadingIndicator message={aiMessage} />}

          {/* Description */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: themeColors.text }]}>Description</Text>
            <TextInput
              style={[
                styles.textarea,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                  color: themeColors.text,
                },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add details..."
              placeholderTextColor={themeColors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Priority */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: themeColors.text }]}>Priority</Text>
            <View style={styles.priorityContainer}>
              {PRIORITIES.map(p => (
                <TouchableOpacity
                  key={p.value}
                  style={[
                    styles.priorityButton,
                    {
                      backgroundColor: priority === p.value ? p.color : themeColors.surface,
                      borderColor: p.color,
                    },
                  ]}
                  onPress={() => setPriority(p.value)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      {
                        color: priority === p.value ? themeColors.onPrimary : themeColors.text,
                      },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Due Date */}
          <DatePicker
            label="Due Date"
            value={dueDate}
            onChange={setDueDate}
            placeholder="No due date"
          />

          {/* Category */}
          <Input
            label="Category"
            value={category}
            onChangeText={setCategory}
            placeholder="e.g., Work, Personal, Shopping"
          />

          {/* Color */}
          <ColorPicker label="Color" value={color} onChange={setColor} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.xs,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerButton: {
    minWidth: 60,
  },
  headerButtonText: {
    ...typography.body,
  },
  saveButtonText: {
    fontWeight: '600',
  },
  headerTitle: {
    ...typography.h3,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  textarea: {
    ...typography.body,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    minHeight: 100,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    alignItems: 'center',
  },
  priorityText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  aiButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
});
