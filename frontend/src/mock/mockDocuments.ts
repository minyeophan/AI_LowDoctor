// src/data/mock/mockDocuments.ts

// 기존 interface 전부 삭제하고 import로 변경!
import { 
  DraftDocument, 
  StorageDocument, 
  CategoryMap 
} from '../types';

// categoryInfo만 여기 유지
export const categoryInfo: CategoryMap = {
  real_estate: { label: '부동산', color: '#5B8DEE' },
};

export const mockDrafts: DraftDocument[] = [
  // 기존 데이터 유지
  {
    id: 'draft-1',
    title: '부동산 매매 계약서.pdf',
    category: 'real_estate',
    progress: 50,
    currentStep: 3,
    totalSteps: 5,
    stepName: '목적물 정보',
    lastEditedAt: '2024-02-22T14:25:00',
    createdAt: '2024-02-18T10:30:00',
  },
  {
    id: 'draft-2',
    title: '임대차 계약서 (전세).hwp',
    category: 'real_estate',
    progress: 80,
    currentStep: 4,
    totalSteps: 5,
    stepName: '특약 사항',
    lastEditedAt: '2024-01-26T12:15:00',
    createdAt: '2024-01-26T09:00:00',
  },
];

export const mockStorageDocuments: StorageDocument[] = [
  // 기존 데이터 유지
  {
    id: 'storage-1',
    title: '부동산 매매 계약서.pdf',
    category: 'real_estate',
    uploadedAt: '2026-02-22T09:30:00',
    analysisStatus: 'completed',
    fileSize: 2621440,
  },
  {
    id: 'storage-2',
    title: '임대차 계약서 (전세).hwp',
    category: 'real_estate',
    uploadedAt: '2026-01-21T14:20:00',
    analysisStatus: 'unanalyzed',
    fileSize: 1887436,
  },
];