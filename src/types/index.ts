
export type Role = 'student' | 'teacher' | 'hod' | 'principal';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string;
  phone?: string;
  address?: string;
  department?: string;
  semester?: number | string;
  rollNumber?: string;
}

export interface Attendance {
  month: string;
  value: number;
}

export interface Mark {
  assessment: string;
  score: number;
  total: number;
}

export interface Doubt {
  id: string;
  studentId: string;
  text: string;
  timestamp: string;
  upvotes: number;
  isResolved: boolean;
  replies: DoubtReply[];
}

export interface DoubtReply {
  id: string;
  authorId: string; // Can be teacher or student
  text: string;
  timestamp: string;
}


export interface ChatMessage {
  id: string;
  author: {
    id: string;
    name: string;
    role: Role;
    avatarUrl: string;
    anonymous: boolean;
  };
  text: string;
  attachments: { name: string; url: string; type: 'image' | 'pdf' | 'document' }[];
  upvotes: number;
  timestamp: string;
  replies: ChatMessage[];
}

export interface Notification {
  id: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface LibraryResource {
    id: string;
    title: string;
    author: string;
    type: 'pdf' | 'video' | 'paper';
    tags: string[];
    url: string;
}
