import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useUserStore } from '../../stores/userStore';
import { getThemeColors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { AIConfig } from '../../types/ai';
import { getFreeModels, getPaidModels, getRecommendedModels } from '../../constants/aiModels';
import { AIUsageModal } from './AIUsageModal';

export function AISettingsPanel() {
  const theme = useUserStore(state => state.preferences?.theme || 'dark');
  const preferences = useUserStore(state => state.preferences);
  const { setApiKey, updatePreferences } = useUserStore();
  const themeColors = getThemeColors(theme);

  const [apiKey, setApiKeyLocal] = useState(preferences?.ai?.openRouterKey || '');
  const [showAllModels, setShowAllModels] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);

  const handleSaveApiKey = async () => {
    await setApiKey(apiKey);
  };

  const toggleFeature = (feature: keyof AIConfig, value: boolean) => {
    const currentAI = preferences?.ai;
    if (!currentAI) return;
    console.log('Toggling feature:', feature, value);

    updatePreferences({
      ai: {
        ...currentAI,
        [feature]: value,
      } as AIConfig,
    });
  };

  const aiFeatures = [
    {
      key: 'autoCategory' as keyof AIConfig,
      label: 'Auto Category Assignment',
      description: 'Automatically suggest categories for new todos',
    },
    {
      key: 'todoImprovement' as keyof AIConfig,
      label: 'Todo Improvement',
      description: 'Enhance todo titles and descriptions',
    },
    {
      key: 'prioritySuggestion' as keyof AIConfig,
      label: 'Priority Suggestions',
      description: 'Suggest priority levels based on content',
    },
    {
      key: 'dueDateSuggestion' as keyof AIConfig,
      label: 'Due Date Suggestions',
      description: 'Recommend due dates from todo content',
    },
    {
      key: 'subtaskGeneration' as keyof AIConfig,
      label: 'Subtask Generation',
      description: 'Break down complex todos into subtasks',
    },
    {
      key: 'tagSuggestion' as keyof AIConfig,
      label: 'Tag Suggestions',
      description: 'Auto-suggest relevant tags',
    },
  ];

  return (
    <View>
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>API Configuration</Text>
        <Text style={[styles.description, { color: themeColors.textSecondary }]}>
          Add your OpenRouter API key to enable AI features. If not provided, the app will use a
          default key with limited usage.
        </Text>
        <Input
          label="OpenRouter API Key"
          value={apiKey}
          onChangeText={setApiKeyLocal}
          placeholder="sk-or-..."
          secureTextEntry={true}
        />
        <Button title="Save API Key" onPress={handleSaveApiKey} variant="secondary" />
      </Card>

      {/* Model Selection */}
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>AI Model</Text>
        <Text style={[styles.description, { color: themeColors.textSecondary }]}>
          Choose which AI model to use. Free models work without an API key, while paid models
          require your own OpenRouter API key.
        </Text>

        {/* Recommended Models */}
        <Text style={[styles.subsectionTitle, { color: themeColors.text }]}>Recommended</Text>
        {getRecommendedModels().map(model => (
          <TouchableOpacity
            key={model.id}
            style={[
              styles.modelOption,
              {
                backgroundColor:
                  preferences?.ai?.model === model.id
                    ? themeColors.primary + '20'
                    : themeColors.surface,
                borderColor:
                  preferences?.ai?.model === model.id ? themeColors.primary : themeColors.border,
              },
            ]}
            onPress={() => {
              const currentAI = preferences?.ai;
              if (!currentAI) return;
              updatePreferences({
                ai: { ...currentAI, model: model.id } as AIConfig,
              });
            }}
          >
            <View style={styles.modelHeader}>
              <Text style={[styles.modelName, { color: themeColors.text }]}>{model.name}</Text>
              <View style={[styles.modelBadge, model.free ? styles.badgeFree : styles.badgePaid]}>
                <Text style={styles.modelBadgeText}>{model.free ? 'FREE' : 'PAID'}</Text>
              </View>
            </View>
            <Text style={[styles.modelProvider, { color: themeColors.textSecondary }]}>
              {model.provider} • {(model.contextWindow / 1000).toFixed(0)}k context
            </Text>
            <Text style={[styles.modelDescription, { color: themeColors.textSecondary }]}>
              {model.description}
            </Text>
          </TouchableOpacity>
        ))}

        {/* All Models Expandable */}
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setShowAllModels(!showAllModels)}
        >
          <Text style={[styles.expandButtonText, { color: themeColors.primary }]}>
            {showAllModels ? 'Show Less' : 'Show All Models'}
          </Text>
          <Ionicons
            name={showAllModels ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={themeColors.primary}
          />
        </TouchableOpacity>

        {showAllModels && (
          <>
            <Text style={[styles.subsectionTitle, { color: themeColors.text }]}>Free Models</Text>
            {getFreeModels()
              .filter(m => !m.recommended)
              .map(model => (
                <TouchableOpacity
                  key={model.id}
                  style={[
                    styles.modelOption,
                    styles.modelOptionCompact,
                    {
                      backgroundColor:
                        preferences?.ai?.model === model.id
                          ? themeColors.primary + '20'
                          : themeColors.surface,
                      borderColor:
                        preferences?.ai?.model === model.id
                          ? themeColors.primary
                          : themeColors.border,
                    },
                  ]}
                  onPress={() => {
                    const currentAI = preferences?.ai;
                    if (!currentAI) return;
                    updatePreferences({
                      ai: { ...currentAI, model: model.id } as AIConfig,
                    });
                  }}
                >
                  <View style={styles.modelHeader}>
                    <Text style={[styles.modelName, { color: themeColors.text }]}>
                      {model.name}
                    </Text>
                    <View style={[styles.modelBadge, styles.badgeFree]}>
                      <Text style={styles.modelBadgeText}>FREE</Text>
                    </View>
                  </View>
                  <Text style={[styles.modelProvider, { color: themeColors.textSecondary }]}>
                    {model.provider}
                  </Text>
                </TouchableOpacity>
              ))}

            <Text style={[styles.subsectionTitle, { color: themeColors.text }]}>Paid Models</Text>
            {getPaidModels()
              .filter(m => !m.recommended)
              .map(model => (
                <TouchableOpacity
                  key={model.id}
                  style={[
                    styles.modelOption,
                    styles.modelOptionCompact,
                    {
                      backgroundColor:
                        preferences?.ai?.model === model.id
                          ? themeColors.primary + '20'
                          : themeColors.surface,
                      borderColor:
                        preferences?.ai?.model === model.id
                          ? themeColors.primary
                          : themeColors.border,
                    },
                  ]}
                  onPress={() => {
                    const currentAI = preferences?.ai;
                    if (!currentAI) return;
                    updatePreferences({
                      ai: { ...currentAI, model: model.id } as AIConfig,
                    });
                  }}
                >
                  <View style={styles.modelHeader}>
                    <Text style={[styles.modelName, { color: themeColors.text }]}>
                      {model.name}
                    </Text>
                    <View style={[styles.modelBadge, styles.badgePaid]}>
                      <Text style={styles.modelBadgeText}>PAID</Text>
                    </View>
                  </View>
                  <Text style={[styles.modelProvider, { color: themeColors.textSecondary }]}>
                    {model.provider}
                  </Text>
                </TouchableOpacity>
              ))}
          </>
        )}
      </Card>

      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>AI Features</Text>
        <View style={styles.featureRow}>
          <View style={styles.featureInfo}>
            <Text style={[styles.featureLabel, { color: themeColors.text }]}>Enable AI</Text>
            <Text style={[styles.featureDescription, { color: themeColors.textSecondary }]}>
              Enable AI features
            </Text>
          </View>
          <Switch
            value={(preferences?.ai?.enabled as boolean) || false}
            onValueChange={value => toggleFeature('enabled', value)}
            trackColor={{ false: themeColors.border, true: themeColors.textSecondary }}
            thumbColor={themeColors.primary}
          />
        </View>
        {aiFeatures.map(feature => (
          <View key={feature.key} style={styles.featureRow}>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureLabel, { color: themeColors.text }]}>
                {feature.label}
              </Text>
              <Text style={[styles.featureDescription, { color: themeColors.textSecondary }]}>
                {feature.description}
              </Text>
            </View>
            <Switch
              disabled={!preferences?.ai?.enabled}
              value={(preferences?.ai?.[feature.key] as boolean) || false}
              onValueChange={value => toggleFeature(feature.key, value)}
              trackColor={{ false: themeColors.border, true: themeColors.textSecondary }}
              thumbColor={themeColors.primary}
            />
          </View>
        ))}
      </Card>

      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Usage Statistics</Text>
        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>
            Total Requests:
          </Text>
          <Text style={[styles.statValue, { color: themeColors.text }]}>
            {preferences?.ai?.requestCount || 0}
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>Tokens Used:</Text>
          <Text style={[styles.statValue, { color: themeColors.text }]}>
            {(preferences?.ai?.totalTokensUsed || 0).toLocaleString()}
          </Text>
        </View>
        {preferences?.ai?.lastUsed && (
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>Last Used:</Text>
            <Text style={[styles.statValue, { color: themeColors.text }]}>
              {new Date(preferences.ai.lastUsed).toLocaleDateString()}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.viewDetailsButton, { backgroundColor: themeColors.primary }]}
          onPress={() => setShowUsageModal(true)}
        >
          <Ionicons name="stats-chart" size={18} color={themeColors.onPrimary} />
          <Text style={styles.viewDetailsButtonText}>View Statistics</Text>
        </TouchableOpacity>
      </Card>

      {/* Usage Modal */}
      <AIUsageModal visible={showUsageModal} onClose={() => setShowUsageModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  featureInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  featureLabel: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDescription: {
    ...typography.caption,
    lineHeight: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  statLabel: {
    ...typography.body,
  },
  statValue: {
    ...typography.body,
    fontWeight: '600',
  },
  subsectionTitle: {
    ...typography.body,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  modelOption: {
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: spacing.sm,
  },
  modelOptionCompact: {
    padding: spacing.sm,
  },
  modelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modelName: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
  },
  modelBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modelBadgeText: {
    ...typography.caption,
    color: '#fff',
    fontWeight: '700',
    fontSize: 10,
  },
  modelProvider: {
    ...typography.caption,
    marginBottom: 4,
  },
  modelDescription: {
    ...typography.caption,
    lineHeight: 16,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  expandButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  badgeFree: {
    backgroundColor: '#10b981',
  },
  badgePaid: {
    backgroundColor: '#f59e0b',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    marginTop: spacing.md,
  },
  viewDetailsButtonText: {
    ...typography.body,
    color: '#000',
    fontWeight: '600',
  },
});
