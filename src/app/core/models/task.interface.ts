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
  attachments?: TaskAttachment[];
  createdAt?: Date;
  updatedAt?: Date;
  source?: 'email' | 'webhook' | 'member';
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

export interface TaskAttachment {
  id: string;
  filename: string;
  fileType: string;
  base64: string; // Required: compressed 800x800px base64 string
  size: number;
  uploadedAt: Date;
  downloadURL?: string; // Optional: for backward compatibility
}
