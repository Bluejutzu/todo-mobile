import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  Easing,
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

function AIHighlight({ active, colors, children }: { active: boolean; colors: any; children: React.ReactNode }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: false }),
        Animated.delay(1200),
        Animated.timing(anim, { toValue: 0, duration: 500, easing: Easing.in(Easing.ease), useNativeDriver: false }),
      ]).start();
    }
  }, [active, anim]);

  const bg = anim.interpolate({ inputRange: [0, 1], outputRange: ['transparent', colors.primary + '15'] });
  const borderColor = anim.interpolate({ inputRange: [0, 1], outputRange: ['transparent', colors.primary + '40'] });

  return (
    <Animated.View style={{ backgroundColor: bg, borderColor, borderWidth: 1, borderRadius: borderRadius.sm, margin: -4, padding: 4 }}>
      {children}
    </Animated.View>
  );
}

export function TodoModal({ visible, todo, onClose, onSave }: TodoModalProps) {
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const preferences = useUserStore(state => state.preferences);
  const { updatePreferences } = useUserStore();
  const colors = getThemeColors(theme);
  const todos = useTodoStore(state => state.todos);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('medium');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [category, setCategory] = useState('');
  const [color, setColor] = useState<string>('#6366f1');

  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiUpdatedFields, setAiUpdatedFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description || '');
      setPriority(todo.priority);
      setDueDate(todo.dueDate);
      setCategory(todo.category || '');
      setColor(todo.color || '#6366f1');
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate(undefined);
      setCategory('');
      setColor('#6366f1');
    }
    setIsAIProcessing(false);
    setAiMessage('');
    setAiUpdatedFields(new Set());
  }, [todo, visible]);

  const markAIField = (field: string) => {
    setAiUpdatedFields(prev => new Set(prev).add(field));
    setTimeout(() => {
      setAiUpdatedFields(prev => {
        const next = new Set(prev);
        next.delete(field);
        return next;
      });
    }, 2000);
  };

  const handleImproveWithAI = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title first');
      return;
    }

    setIsAIProcessing(true);
    setAiMessage('Improving todo with AI...');

    let totalTokens = 0;
    let requestsMade = 0;

    try {
      const currentTodo = { title, description, category, priority, dueDate };

      if (preferences?.ai?.todoImprovement) {
        setAiMessage('Enhancing title and description...');
        const result = await aiService.improveTodo(currentTodo, todos, {
          userApiKey: preferences?.ai?.openRouterKey,
          model: preferences?.ai?.model,
        });
        if (result.success && result.result) {
          if (result.result.title) { setTitle(result.result.title); markAIField('title'); }
          if (result.result.description) { setDescription(result.result.description); markAIField('description'); }
          if (result.tokensUsed) totalTokens += result.tokensUsed;
          requestsMade++;
        }
      }

      if (preferences?.ai?.autoCategory && !category) {
        setAiMessage('Suggesting category...');
        const result = await aiService.suggestCategory(currentTodo, todos, {
          userApiKey: preferences?.ai?.openRouterKey,
          model: preferences?.ai?.model,
        });
        if (result.success && result.result) {
          setCategory(result.result.category);
          markAIField('category');
          if (result.tokensUsed) totalTokens += result.tokensUsed;
          requestsMade++;
        }
      }

      if (preferences?.ai?.prioritySuggestion) {
        setAiMessage('Analyzing priority...');
        const result = await aiService.suggestPriority(currentTodo, todos, {
          userApiKey: preferences?.ai?.openRouterKey,
          model: preferences?.ai?.model,
        });
        if (result.success && result.result) {
          setPriority(result.result.priority);
          markAIField('priority');
          if (result.tokensUsed) totalTokens += result.tokensUsed;
          requestsMade++;
        }
      }

      if (requestsMade > 0 && preferences?.ai) {
        updatePreferences({
          ai: {
            ...preferences.ai,
            requestCount: (preferences.ai.requestCount || 0) + requestsMade,
            totalTokensUsed: (preferences.ai.totalTokensUsed || 0) + totalTokens,
            lastUsed: new Date(),
          } as AIConfig,
        });
      }

      setAiMessage('Done!');
      setTimeout(() => { setIsAIProcessing(false); setAiMessage(''); }, 1000);
    } catch (error) {
      console.error('AI improvement error:', error);
      Alert.alert('Error', 'Failed to improve todo with AI');
      setIsAIProcessing(false);
      setAiMessage('');
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate,
      category: category.trim() || undefined,
      color,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {todo ? 'Edit Todo' : 'New Todo'}
          </Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <Text style={[styles.saveText, { color: title.trim() ? colors.primary : colors.textSecondary }]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
          <AIHighlight active={aiUpdatedFields.has('title')} colors={colors}>
            <Input label="Title" value={title} onChangeText={setTitle} placeholder="What needs to be done?" autoFocus />
          </AIHighlight>

          {preferences?.ai?.enabled && (
            <TouchableOpacity
              style={[styles.aiButton, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}
              onPress={handleImproveWithAI}
              disabled={isAIProcessing || !title.trim()}
              activeOpacity={0.7}
            >
              <Ionicons name="sparkles" size={16} color={colors.primary} />
              <Text style={[styles.aiButtonText, { color: colors.primary }]}>Improve with AI</Text>
            </TouchableOpacity>
          )}

          {isAIProcessing && <AILoadingIndicator message={aiMessage} />}

          <AIHighlight active={aiUpdatedFields.has('description')} colors={colors}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Description</Text>
              <TextInput
                style={[styles.textarea, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Add details..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </AIHighlight>

          <AIHighlight active={aiUpdatedFields.has('priority')} colors={colors}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Priority</Text>
              <View style={styles.priorityContainer}>
                {PRIORITIES.map(p => (
                  <TouchableOpacity
                    key={p.value}
                    style={[
                      styles.priorityButton,
                      {
                        backgroundColor: priority === p.value ? p.color : colors.input,
                        borderColor: priority === p.value ? p.color : colors.border,
                      },
                    ]}
                    onPress={() => setPriority(p.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.priorityText, { color: priority === p.value ? '#fff' : colors.text }]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </AIHighlight>

          <DatePicker label="Due Date" value={dueDate} onChange={setDueDate} placeholder="No due date" />

          <AIHighlight active={aiUpdatedFields.has('category')} colors={colors}>
            <Input label="Category" value={category} onChangeText={setCategory} placeholder="e.g., Work, Personal, Shopping" />
          </AIHighlight>

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
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    minWidth: 60,
  },
  cancelText: {
    ...typography.body,
  },
  saveText: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'right',
  },
  headerTitle: {
    ...typography.h3,
    fontSize: 17,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  field: {
    marginBottom: 4,
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
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
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
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  aiButtonText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
});
