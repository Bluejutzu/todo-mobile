import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { getModelById } from '../../constants/aiModels';

interface AIUsageModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AIUsageModal({ visible, onClose }: AIUsageModalProps) {
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const preferences = useUserStore(state => state.preferences);
  const themeColors = getThemeColors(theme);

  const aiConfig = preferences?.ai;
  const currentModel = aiConfig?.model ? getModelById(aiConfig.model) : null;

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>AI Usage Statistics</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={themeColors.text} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Current Model */}
          <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="hardware-chip" size={20} color={themeColors.primary} />
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Current Model</Text>
            </View>
            <Text style={[styles.modelName, { color: themeColors.text }]}>
              {currentModel?.name || 'No model selected'}
            </Text>
            {currentModel && (
              <>
                <Text style={[styles.modelDetail, { color: themeColors.textSecondary }]}>
                  {currentModel.provider} • {currentModel.free ? 'Free' : 'Paid'}
                </Text>
                <Text style={[styles.modelDescription, { color: themeColors.textSecondary }]}>
                  {currentModel.description}
                </Text>
              </>
            )}
          </View>

          {/* Usage Stats */}
          <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="stats-chart" size={20} color={themeColors.primary} />
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Usage Statistics
              </Text>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: themeColors.primary }]}>
                  {formatNumber(aiConfig?.requestCount || 0)}
                </Text>
                <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
                  Total Requests
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: themeColors.primary }]}>
                  {formatNumber(aiConfig?.totalTokensUsed || 0)}
                </Text>
                <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
                  Tokens Used
                </Text>
              </View>
            </View>

            <View style={[styles.infoBox, { backgroundColor: themeColors.background }]}>
              <Ionicons name="information-circle" size={16} color={themeColors.textSecondary} />
              <Text style={[styles.infoText, { color: themeColors.textSecondary }]}>
                Average:{' '}
                {aiConfig?.requestCount
                  ? Math.round((aiConfig.totalTokensUsed || 0) / aiConfig.requestCount)
                  : 0}{' '}
                tokens per request
              </Text>
            </View>
          </View>

          {/* Last Used */}
          <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={20} color={themeColors.primary} />
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Last Activity</Text>
            </View>
            <Text style={[styles.lastUsedText, { color: themeColors.text }]}>
              {formatDate(aiConfig?.lastUsed)}
            </Text>
          </View>

          {/* Enabled Features */}
          <View style={[styles.section, { backgroundColor: themeColors.surface }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkmark-circle" size={20} color={themeColors.primary} />
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Active Features
              </Text>
            </View>
            <View style={styles.featuresList}>
              {aiConfig?.todoImprovement && (
                <View style={styles.featureItem}>
                  <Ionicons name="sparkles" size={16} color={themeColors.primary} />
                  <Text style={[styles.featureText, { color: themeColors.text }]}>
                    Todo Improvement
                  </Text>
                </View>
              )}
              {aiConfig?.autoCategory && (
                <View style={styles.featureItem}>
                  <Ionicons name="pricetag" size={16} color={themeColors.primary} />
                  <Text style={[styles.featureText, { color: themeColors.text }]}>
                    Auto Category
                  </Text>
                </View>
              )}
              {aiConfig?.prioritySuggestion && (
                <View style={styles.featureItem}>
                  <Ionicons name="flag" size={16} color={themeColors.primary} />
                  <Text style={[styles.featureText, { color: themeColors.text }]}>
                    Priority Suggestion
                  </Text>
                </View>
              )}
              {aiConfig?.subtaskGeneration && (
                <View style={styles.featureItem}>
                  <Ionicons name="list" size={16} color={themeColors.primary} />
                  <Text style={[styles.featureText, { color: themeColors.text }]}>
                    Subtask Generation
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
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
  headerTitle: {
    ...typography.h3,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
  },
  section: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  modelName: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  modelDetail: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  modelDescription: {
    ...typography.bodySmall,
    lineHeight: 20,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  statValue: {
    ...typography.h2,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  infoText: {
    ...typography.caption,
    flex: 1,
  },
  lastUsedText: {
    ...typography.body,
  },
  featuresList: {
    gap: spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    ...typography.body,
  },
});
