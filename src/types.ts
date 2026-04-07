export interface User {
  id: string;
  name: string;
  avatar?: string;
  avatarStyle?: 'glass' | 'icons' | 'identicon' | 'initials' | 'rings' | 'shapes' | 'thumbs';
  lastActive?: string;
  isOnline?: boolean;
  role: 'admin' | 'user' | 'client';
}

export type TaskStatus = 'todo' | 'doing' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  clientId: string | null;
  startDate?: string;
  dueDate: string;
  finishedAt?: string;
  completionNotes?: string;
  createdAt: string;
  updatedAt?: string;
  tags?: { name: string; color: string }[];
  links?: string[];
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  icon?: string;
  industry?: string;
  contactPerson?: string;
  notes?: string;
  createdAt: string;
}

export interface Folder {
  id: string;
  clientId: string;
  name: string;
  folderId: string | null;
  order: number;
  createdAt: string;
}

export interface Briefing {
  id: string;
  clientId: string;
  folderId: string | null;
  title: string;
  content: string;
  order: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Objective {
  id: string;
  clientId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'done';
  taskId?: string;
  category: { name: string; color: string };
  visibility: 'internal' | 'public';
  createdBy: string;
  creatorRole: 'admin' | 'user' | 'client';
  createdAt: string;
  updatedAt?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  targetId?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: string;
}
