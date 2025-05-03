
export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: number;
}

export type TodoFilter = 'all' | 'active' | 'completed';
