export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  assignedTo: string[];
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'triage' | 'todo' | 'in-progress' | 'await-feedback' | 'done';
  subtasks: Subtask[];

  createdAt?: Date;
  updatedAt?: Date;
  source?: 'email' |'member';
  creatorType?: 'member' | 'external';
  creatorEmail?: string;
  creatorName?: string;
  aiGenerated?: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}
