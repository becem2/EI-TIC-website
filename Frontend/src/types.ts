export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp?: Date;
}

export interface ResearchAxis {
  id: string;
  title: string;
  icon: string;
  description: string;
  fullDescription: string;
  projects: string[];
  publications: string[];
  keywords: string[];
}

export interface StrategicChallenge {
  id: number;
  title: string;
  description: string;
  projects: string[];
}

export interface TeamMember {
  name: string;
  role: string;
  avatar: string;
  bio: string;
  specialties: string[];
}

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface PublicationAuthor {
  id?: string;
  userId?: string;
  name: string;
  role?: string;
}

export type PublicationType =
  | 'Communication'
  | 'Article scientifique'
  | "Chapitre d'ouvrage"
  | 'Ouvrage scientifique';

export type PublicationDetails = Record<string, string>;

export interface Publication {
  id: string;
  _id?: string;
  title: string;
  year: number;
  type: PublicationType;
  details?: PublicationDetails;
  authors: PublicationAuthor[];
  journal: string;
  abstract: string;
  introduction?: string;
  methodology?: string;
  conclusion?: string;
  keywords: string[];
  citationsCount: number;
  downloadsCount?: number;
  isPrivate?: boolean;
  submittedBy?: string;
  pdfUrl?: string;
  doi: string;
  department: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  category: 'Événement' | 'Découverte' | 'Distinction' | 'Partenariat' | 'Conférence';
  date: string;
  author: string;
  readTime: string;
  excerpt: string;
  content: string;
  imageUrl?: string;
  isImportant?: boolean;
}

export interface FilterState {
  year: string;
  type: string;
  researcher: string;
  keyword: string;
  department: string;
  sortBy: 'recent' | 'citations' | 'alphabetical';
}
