// src/types/document.ts
import { CategoryType } from './category';
export interface DraftDocument {
  id: string;
  title: string;
  category: CategoryType;
  progress: number;
  statusText: string;
  lastEditedAt: string;
}
export interface StorageDocument {
  id: string;
  title: string;
  category: CategoryType;
  uploadedAt: string;
  analysisStatus: 'completed' | 'unanalyzed' | 'analyzing' | 'pending';
  fileSize?: number;
  fileUrl?: string;  // 추가
}
export type AnalysisStatus = 'completed' | 'unanalyzed' | 'analyzing';
