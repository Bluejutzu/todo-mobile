export type TodoPriority = 'low' | 'medium' | 'high';

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: TodoPriority;
  dueDate?: Date;
  category?: string;
  tags?: string[];
  color?: string;
  subtasks?: Subtask[];
  attachments?: Attachment[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  deletedAt?: Date;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Attachment {
  id: string;
  type: 'image' | 'file';
  uri: string;
  name: string;
  size?: number;
}

export type TodoFilter = 'all' | 'active' | 'completed';
export type TodoSortBy = 'createdAt' | 'updatedAt' | 'title' | 'priority' | 'dueDate';

export interface TodoContextAction {
  id: string;
  label: string;
  icon: string;
  destructive?: boolean;
  onPress: () => void;
}
