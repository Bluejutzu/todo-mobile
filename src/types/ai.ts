export type AIProvider = 'openrouter' | 'anthropic' | 'openai' | 'google';

export interface AIConfig {
  enabled: boolean;
  provider: AIProvider;
  model: string;

  // API Keys (encrypted in storage)
  openRouterKey?: string;
  anthropicKey?: string;
  openAIKey?: string;
  googleAIKey?: string;

  // Usage tracking
  requestCount: number;
  totalTokensUsed: number;
  lastUsed?: Date;

  // Feature flags
  autoCategory?: boolean;
  todoImprovement?: boolean;
  prioritySuggestion?: boolean;
  dueDateSuggestion?: boolean;
  subtaskGeneration?: boolean;
  tagSuggestion?: boolean;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  free: boolean;
  costPer1kTokens?: number;
  description: string;
  contextWindow: number;
}

export type AIFeatureType =
  | 'auto-category'
  | 'improve'
  | 'priority'
  | 'due-date'
  | 'subtasks'
  | 'tags';

export interface AIFeature {
  id: AIFeatureType;
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
}

export interface AIResponse<T = any> {
  success: boolean;
  result?: T;
  error?: string;
  tokensUsed?: number;
}

export interface CategorySuggestion {
  category: string;
  confidence: number;
}

export interface TodoImprovement {
  title?: string;
  description?: string;
  tags?: string[];
}

export interface PrioritySuggestion {
  priority: 'low' | 'medium' | 'high';
  reason: string;
}

export interface DueDateSuggestion {
  dueDate: Date;
  reason: string;
}
