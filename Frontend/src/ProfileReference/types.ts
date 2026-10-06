import type { PublicationType } from '../types';

export interface LanguageItem {
  id: string;
  name: string;
  level: string;
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  period: string;
}

export interface WorkHistoryItem {
  id: string;
  role: string;
  organization: string;
  period: string;
  description?: string;
}

export interface PublicationItem {
  id: string;
  title: string;
  status: 'published' | 'draft';
  type?: PublicationType;
  image?: string;
  journal?: string;
  year?: number;
  citations?: number;
  downloadsCount?: number;
  doi?: string;
  abstract?: string;
  introduction?: string;
  methodology?: string;
  conclusion?: string;
  authors?: string[];
  linkedAuthors?: Array<{ userId: string; name: string }>;
  keywords?: string[];
  pdfUrl?: string;
}

export interface LinkedAccountItem {
  id: string;
  type: 'github' | 'email' | 'orcid' | 'scholar' | 'linkedin';
  name: string;
  handle: string;
  meta?: string;
  avatar?: string;
  url?: string;
}

export interface ResearcherProfile {
  name: string;
  prefix: string;
  titleTag: string;
  location: string;
  timezone: string;
  avatar: string;
  researchImage?: string;
  isVerified: boolean;
  availabilityBadge: boolean;
  boostProfile: boolean;
  citationsCount: number;
  hoursPerWeek: string;
  availabilityNote: string;
  hasVideoIntro: boolean;
  videoIntroUrl?: string;
  idStatus: 'unverified' | 'verified' | 'pending';
  militaryVeteran: boolean;
  summaryText: string;
  researchAxes: string[];
  skills: string[];
  education: EducationItem[];
  workHistory: WorkHistoryItem[];
  publications: PublicationItem[];
  linkedAccounts: LinkedAccountItem[];
  languages: LanguageItem[];
}

export type ActiveNavTab = 'accueil' | 'a-propos' | 'chercheurs' | 'publications' | 'actualites' | 'collaborations';
