import axios from 'axios';
import Constants from 'expo-constants';
import type { Todo, Subtask } from '../types/todo';
import type {
  AIResponse,
  CategorySuggestion,
  TodoImprovement,
  PrioritySuggestion,
  DueDateSuggestion,
} from '../types/ai';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet';

interface AIServiceConfig {
  userApiKey?: string;
  model?: string;
}

class AIService {
  private getApiKey(userKey?: string): string | null {
    // Priority: User's custom key > App's key from env
    if (userKey) return userKey;

    const appKey =
      Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENROUTER_API_KEY ||
      process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

    return appKey || null;
  }

  private async makeRequest<T>(
    messages: Array<{ role: string; content: string }>,
    config: AIServiceConfig = {}
  ): Promise<AIResponse<T>> {
    const apiKey = this.getApiKey(config.userApiKey);

    // Import store dynamically to avoid circular dependencies
    const { useSubscriptionStore } = require('../stores/subscriptionStore');
    const subscriptionStore = useSubscriptionStore.getState();

    // Check limits
    const { usage, checkLimit } = subscriptionStore;

    if (!checkLimit('aiRequestsPerDay', usage.aiRequestsToday + 1)) {
      return {
        success: false,
        error: 'Daily AI request limit reached. Upgrade to Premium for unlimited requests.',
      };
    }

    if (!apiKey) {
      console.error('[AI Service] No API key available');
      return {
        success: false,
        error: 'No API key available. Please add your OpenRouter API key in settings.',
      };
    }

    try {
      console.log('[AI Service] Sending request to OpenRouter...');
      const response = await axios.post(
        OPENROUTER_API_URL,
        {
          model: config.model || DEFAULT_MODEL,
          messages,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://todo-mobile.app',
            'X-Title': 'Todo Mobile App',
          },
        }
      );

      // Update usage
      subscriptionStore.updateUsage({
        aiRequestsToday: usage.aiRequestsToday + 1,
      });

      const content = response.data.choices[0]?.message?.content;
      const tokensUsed = response.data.usage?.total_tokens;

      if (!content) {
        console.error('[AI Service] No content in response');
        return {
          success: false,
          error: 'No response from AI',
        };
      }
      // Try to parse JSON response
      try {
        const result = JSON.parse(content) as T;
        return {
          success: true,
          result,
          tokensUsed,
        };
      } catch {
        console.log('[AI Service] Content is not JSON, returning as string');
        // If not JSON, return as string
        return {
          success: true,
          result: content as T,
          tokensUsed,
        };
      }
    } catch (error: any) {
      console.error('[AI Service] Request error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || 'AI request failed',
      };
    }
  }

  private buildContext(todos: Todo[]): string {
    const categories = [...new Set(todos.map(t => t.category).filter(Boolean))];
    const recentTodos = todos.slice(0, 10);

    return `
Context about user's todos:
- Existing categories: ${categories.join(', ') || 'None'}
- Recent todos: ${recentTodos.map(t => `"${t.title}" (${t.category || 'uncategorized'})`).join(', ')}
- Total todos: ${todos.length}
    `.trim();
  }

  async suggestCategory(
    todo: Partial<Todo>,
    existingTodos: Todo[],
    config: AIServiceConfig = {}
  ): Promise<AIResponse<CategorySuggestion>> {
    const context = this.buildContext(existingTodos);
    const existingCategories = [...new Set(existingTodos.map(t => t.category).filter(Boolean))];

    const messages = [
      {
        role: 'system',
        content: `You are a helpful assistant that suggests categories for todos. 
${context}

Respond with JSON in this format: {"category": "suggested category", "confidence": 0.9}
Use existing categories when appropriate, or suggest a new one if needed.`,
      },
      {
        role: 'user',
        content: `Suggest a category for this todo:
Title: ${todo.title || 'Untitled'}
Description: ${todo.description || 'No description'}

Existing categories: ${existingCategories.join(', ') || 'None'}`,
      },
    ];

    return this.makeRequest<CategorySuggestion>(messages, config);
  }

  async improveTodo(
    todo: Partial<Todo>,
    existingTodos: Todo[],
    config: AIServiceConfig = {}
  ): Promise<AIResponse<TodoImprovement>> {
    const context = this.buildContext(existingTodos);

    const messages = [
      {
        role: 'system',
        content: `You are a helpful assistant that improves todo items to be more clear, actionable, and well-structured.
${context}

Respond with JSON in this format: {"title": "improved title", "description": "improved description", "tags": ["tag1", "tag2"]}
Make the title concise and action-oriented. Expand the description to be more detailed and helpful.`,
      },
      {
        role: 'user',
        content: `Improve this todo:
Title: ${todo.title || 'Untitled'}
Description: ${todo.description || 'No description'}`,
      },
    ];

    return this.makeRequest<TodoImprovement>(messages, config);
  }

  async suggestPriority(
    todo: Partial<Todo>,
    existingTodos: Todo[],
    config: AIServiceConfig = {}
  ): Promise<AIResponse<PrioritySuggestion>> {
    const context = this.buildContext(existingTodos);

    const messages = [
      {
        role: 'system',
        content: `You are a helpful assistant that suggests priority levels for todos.
${context}

Respond with JSON in this format: {"priority": "high|medium|low", "reason": "brief explanation"}
Consider urgency, importance, and context.`,
      },
      {
        role: 'user',
        content: `Suggest priority for this todo:
Title: ${todo.title || 'Untitled'}
Description: ${todo.description || 'No description'}
Due Date: ${todo.dueDate ? new Date(todo.dueDate).toLocaleDateString() : 'Not set'}`,
      },
    ];

    return this.makeRequest<PrioritySuggestion>(messages, config);
  }

  async suggestDueDate(
    todo: Partial<Todo>,
    existingTodos: Todo[],
    config: AIServiceConfig = {}
  ): Promise<AIResponse<DueDateSuggestion>> {
    const context = this.buildContext(existingTodos);

    const messages = [
      {
        role: 'system',
        content: `You are a helpful assistant that suggests due dates for todos.
${context}

Today's date: ${new Date().toISOString().split('T')[0]}

Respond with JSON in this format: {"dueDate": "YYYY-MM-DD", "reason": "brief explanation"}
Suggest realistic due dates based on the todo content and context.`,
      },
      {
        role: 'user',
        content: `Suggest a due date for this todo:
Title: ${todo.title || 'Untitled'}
Description: ${todo.description || 'No description'}`,
      },
    ];

    const response = await this.makeRequest<{ dueDate: string; reason: string }>(messages, config);

    if (response.success && response.result) {
      return {
        success: true,
        result: {
          dueDate: new Date(response.result.dueDate),
          reason: response.result.reason,
        },
        tokensUsed: response.tokensUsed,
      };
    }

    return response as unknown as AIResponse<DueDateSuggestion>;
  }

  async generateSubtasks(
    todo: Partial<Todo>,
    existingTodos: Todo[],
    config: AIServiceConfig = {}
  ): Promise<AIResponse<Subtask[]>> {
    const context = this.buildContext(existingTodos);

    const messages = [
      {
        role: 'system',
        content: `You are a helpful assistant that breaks down todos into actionable subtasks.
${context}

Respond with JSON array in this format: [{"id": "uuid", "title": "subtask title", "completed": false}]
Create 3-5 logical, actionable subtasks. Generate unique IDs for each.`,
      },
      {
        role: 'user',
        content: `Break down this todo into subtasks:
Title: ${todo.title || 'Untitled'}
Description: ${todo.description || 'No description'}`,
      },
    ];

    const response = await this.makeRequest<Subtask[]>(messages, config);

    if (response.success && response.result) {
      return {
        success: true,
        result: response.result,
        tokensUsed: response.tokensUsed,
      };
    }

    return response as AIResponse<Subtask[]>;
  }

  async suggestTags(
    todo: Partial<Todo>,
    existingTodos: Todo[],
    config: AIServiceConfig = {}
  ): Promise<AIResponse<string[]>> {
    const context = this.buildContext(existingTodos);
    const existingTags = [...new Set(existingTodos.flatMap(t => t.tags || []))];

    const messages = [
      {
        role: 'system',
        content: `You are a helpful assistant that suggests relevant tags for todos.
${context}

Existing tags: ${existingTags.join(', ') || 'None'}

Respond with JSON array of strings: ["tag1", "tag2", "tag3"]
Suggest 2-4 relevant tags. Prefer existing tags when appropriate.`,
      },
      {
        role: 'user',
        content: `Suggest tags for this todo:
Title: ${todo.title || 'Untitled'}
Description: ${todo.description || 'No description'}
Category: ${todo.category || 'None'}`,
      },
    ];

    return this.makeRequest<string[]>(messages, config);
  }
}

export const aiService = new AIService();
