// src/types/document.ts
import { CategoryType } from './category';

export interface DraftDocument {
  id: string;
  title: string;
  category: CategoryType;
  progress: number;
  currentStep: number;
  totalSteps: number;
  stepName: string;
  lastEditedAt: string;
  createdAt: string;
}

export interface StorageDocument {
  id: string;
  title: string;
  category: CategoryType;
  uploadedAt: string;
  analysisStatus: 'completed' | 'unanalyzed' | 'analyzing';
  fileSize?: number;
}

export type AnalysisStatus = 'completed' | 'unanalyzed' | 'analyzing';