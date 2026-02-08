// OpenRouter AI Models
// Source: https://openrouter.ai/models

export interface AIModelOption {
  id: string;
  name: string;
  provider: string;
  free: boolean;
  contextWindow: number;
  description: string;
  recommended?: boolean;
}

export const OPENROUTER_MODELS: AIModelOption[] = [
  // Recommended Free Models
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B Instruct',
    provider: 'Meta',
    free: true,
    contextWindow: 128000,
    description: 'High-quality open model, great for general tasks',
    recommended: true,
  },
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    free: true,
    contextWindow: 1000000,
    description: 'Fast and efficient, excellent for quick responses',
    recommended: true,
  },
  {
    id: 'deepseek/deepseek-r1:free',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    free: true,
    contextWindow: 64000,
    description: 'Powerful reasoning model, comparable to GPT-4',
    recommended: true,
  },

  // Other Free Models
  {
    id: 'deepseek/deepseek-chat-v3-0324:free',
    name: 'DeepSeek Chat V3',
    provider: 'DeepSeek',
    free: true,
    contextWindow: 64000,
    description: 'Conversational model with enhanced dialogue',
  },
  {
    id: 'qwen/qwen-2.5-72b-instruct:free',
    name: 'Qwen 2.5 72B Instruct',
    provider: 'Qwen',
    free: true,
    contextWindow: 32000,
    description: 'Strong multilingual capabilities',
  },
  {
    id: 'microsoft/phi-4:free',
    name: 'Phi-4',
    provider: 'Microsoft',
    free: true,
    contextWindow: 16000,
    description: 'Compact but capable model',
  },

  // Paid Models (Require API Key)
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    free: false,
    contextWindow: 200000,
    description: 'Top-tier reasoning and coding, best quality',
    recommended: true,
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    free: false,
    contextWindow: 200000,
    description: 'Fast and affordable Claude model',
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    free: false,
    contextWindow: 128000,
    description: 'Latest GPT-4 with vision and audio',
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    free: false,
    contextWindow: 128000,
    description: 'Affordable GPT-4 variant',
  },
  {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini Pro 1.5',
    provider: 'Google',
    free: false,
    contextWindow: 2000000,
    description: 'Massive context window, great for long documents',
  },
  {
    id: 'perplexity/llama-3.1-sonar-large-128k-online',
    name: 'Sonar Large (Online)',
    provider: 'Perplexity',
    free: false,
    contextWindow: 128000,
    description: 'Real-time web search capabilities',
  },
];

// Get free models only
export const getFreeModels = () => OPENROUTER_MODELS.filter(m => m.free);

// Get paid models only
export const getPaidModels = () => OPENROUTER_MODELS.filter(m => !m.free);

// Get recommended models
export const getRecommendedModels = () => OPENROUTER_MODELS.filter(m => m.recommended);

// Get model by ID
export const getModelById = (id: string) => OPENROUTER_MODELS.find(m => m.id === id);
