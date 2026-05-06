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

export const OPENROUTER_DEFAULT_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';

export const OPENROUTER_MODELS: AIModelOption[] = [
  // Recommended Free Models
  {
    id: OPENROUTER_DEFAULT_MODEL,
    name: 'Meta: Llama 3.3 70B Instruct (free)',
    provider: 'Meta',
    free: true,
    contextWindow: 65536,
    description: 'High-quality open model, great for general tasks',
    recommended: true,
  },
  {
    id: 'openai/gpt-oss-120b:free',
    name: 'OpenAI: gpt-oss-120b (free)',
    provider: 'OpenAI',
    free: true,
    contextWindow: 131072,
    description: 'Large open-weight model with strong general capability',
    recommended: true,
  },
  {
    id: 'qwen/qwen3-next-80b-a3b-instruct:free',
    name: 'Qwen: Qwen3 Next 80B A3B Instruct (free)',
    provider: 'Qwen',
    free: true,
    contextWindow: 262144,
    description: 'Strong multilingual model with a large context window',
    recommended: true,
  },

  // Other Free Models
  {
    id: 'google/gemma-4-26b-a4b-it:free',
    name: 'Google: Gemma 4 26B A4B (free)',
    provider: 'Google',
    free: true,
    contextWindow: 262144,
    description: 'Efficient Google open model for everyday tasks',
  },
  {
    id: 'openai/gpt-oss-20b:free',
    name: 'OpenAI: gpt-oss-20b (free)',
    provider: 'OpenAI',
    free: true,
    contextWindow: 131072,
    description: 'Smaller free OpenAI open-weight model',
  },
  {
    id: 'openrouter/free',
    name: 'Free Models Router',
    provider: 'OpenRouter',
    free: true,
    contextWindow: 200000,
    description: 'OpenRouter-managed route across currently available free models',
  },

  // Paid Models (Require API Key)
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek: R1',
    provider: 'DeepSeek',
    free: false,
    contextWindow: 64000,
    description: 'Powerful reasoning model for complex tasks',
    recommended: true,
  },
  {
    id: 'deepseek/deepseek-chat-v3-0324',
    name: 'DeepSeek: DeepSeek V3 0324',
    provider: 'DeepSeek',
    free: false,
    contextWindow: 163840,
    description: 'Conversational model with enhanced dialogue',
  },
  {
    id: 'google/gemini-2.0-flash-001',
    name: 'Google: Gemini 2.0 Flash',
    provider: 'Google',
    free: false,
    contextWindow: 1048576,
    description: 'Fast and efficient, excellent for quick responses',
    recommended: true,
  },
  {
    id: 'qwen/qwen-2.5-72b-instruct',
    name: 'Qwen2.5 72B Instruct',
    provider: 'Qwen',
    free: false,
    contextWindow: 32768,
    description: 'Strong multilingual capabilities',
  },
  {
    id: 'microsoft/phi-4',
    name: 'Microsoft: Phi 4',
    provider: 'Microsoft',
    free: false,
    contextWindow: 16384,
    description: 'Compact but capable model',
  },
  {
    id: 'anthropic/claude-sonnet-4.6',
    name: 'Anthropic: Claude Sonnet 4.6',
    provider: 'Anthropic',
    free: false,
    contextWindow: 1000000,
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
    id: 'google/gemini-2.5-pro',
    name: 'Google: Gemini 2.5 Pro',
    provider: 'Google',
    free: false,
    contextWindow: 1048576,
    description: 'Massive context window, great for long documents',
  },
  {
    id: 'perplexity/sonar-pro',
    name: 'Perplexity: Sonar Pro',
    provider: 'Perplexity',
    free: false,
    contextWindow: 200000,
    description: 'Real-time web search capabilities',
  },
];

const OPENROUTER_MODEL_ALIASES: Record<string, string> = {
  'google/gemini-2.0-flash-exp:free': 'google/gemini-2.0-flash-001',
  'deepseek/deepseek-r1:free': 'deepseek/deepseek-r1',
  'deepseek/deepseek-chat-v3-0324:free': 'deepseek/deepseek-chat-v3-0324',
  'qwen/qwen-2.5-72b-instruct:free': 'qwen/qwen-2.5-72b-instruct',
  'microsoft/phi-4:free': 'microsoft/phi-4',
  'anthropic/claude-3.5-sonnet': 'anthropic/claude-sonnet-4.6',
  'google/gemini-pro-1.5': 'google/gemini-2.5-pro',
  'perplexity/llama-3.1-sonar-large-128k-online': 'perplexity/sonar-pro',
};

// Get free models only
export const getFreeModels = () => OPENROUTER_MODELS.filter(m => m.free);

// Get paid models only
export const getPaidModels = () => OPENROUTER_MODELS.filter(m => !m.free);

// Get recommended models
export const getRecommendedModels = () => OPENROUTER_MODELS.filter(m => m.recommended);

// Get model by ID
export const getModelById = (id: string) => OPENROUTER_MODELS.find(m => m.id === id);

export const normalizeOpenRouterModelId = (id?: string | null) => {
  if (!id) return OPENROUTER_DEFAULT_MODEL;

  const aliasedId = OPENROUTER_MODEL_ALIASES[id] || id;
  return getModelById(aliasedId) ? aliasedId : OPENROUTER_DEFAULT_MODEL;
};
