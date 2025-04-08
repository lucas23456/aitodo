export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export type Task = {
  id: string;
  title: string;
  description?: string;
  due_date?: string | null;
  priority: Priority;
  project_id?: string | null;
  is_completed: boolean;
  completed_at?: string | null;
  created_at: string;
  updated_at?: string | null;
  user_id: string;
  reminder?: string | null;
  tags?: string[];
}; 