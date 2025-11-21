export type AIProvider = 'app-openrouter' | 'own-openrouter' | 'anthropic' | 'openai' | 'google';

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
  lastUsed?: Date;

  // Feature flags
  autoSuggest?: boolean;
  smartCategorization?: boolean;
  voiceInput?: boolean;
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

export interface AIFeature {
  id: 'improve' | 'expand' | 'summarize' | 'subtasks' | 'priority' | 'duedate';
  label: string;
  description: string;
  icon: string;
}

export interface AIResponse {
  success: boolean;
  result?: string;
  error?: string;
  tokensUsed?: number;
}
