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
  {
    id: 'draft-1',
    title: '부동산 매매 계약서.pdf',
    category: 'real_estate',
    progress: 20,
    statusText: '분석 중',
    lastEditedAt: '2026-04-11',
  },
];

export const mockStorageDocuments: StorageDocument[] = [
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