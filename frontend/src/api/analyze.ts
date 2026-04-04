// src/api/analyze.ts
import { apiClient } from './client';

// ==================== 타입 정의 ====================

export interface AnalyzeRequest {
  documentId: string;
}

export interface AnalyzeResponse {
  message: string;
  analysisId: string;
}

// ✅ AnalysisResult 타입 수정 (백엔드 응답 형식에 맞게)
export interface AnalysisResult {
  analysisId: string;
  documentId: string;
  content?: string;
  extractedText?: string; 
  status?: 'processing' | 'completed' | 'failed';
  analyzedAt: string;
  errorMessage?: string;            // ← 추가
 

  // 위험 요소
  risks?: Risk[];
  riskItems?: RiskItem[]; 
  // 일정
  schedules?: Schedule[];
  
  // 요약 및 권장사항
  summary?: SummaryItem[];
  recommendations?: string[];
  
  // 계약 팁 
   contractTip?: {               //
    docType: string;
    title: string;
    items: string[];
  };

  // 개선 가이드
  improvementGuides?: ImprovementGuide[];  
  
  // 양식
  forms?: any[];
}

// 위험 요소 (Risk)
export interface Risk {
  id: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  location: string;
}

// 위험 항목 (RiskItem) - AiPage에서 사용
export interface RiskItem {
  id: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  location: string;
  recommendation?: string;
  searchKeyword?: string; 
  clauseText?: string; 
  riskLevel?: 'high' | 'medium' | 'low'; 
  reason?: string;                          
  guide?: string; 
  improvedClause?: string; 
  checkPoints?: string[];
}

// 일정
export interface Schedule {
  id: string;
  title: string;
  date: string;
  type: string;
  description: string;
}

// 계약 팁
export interface ContractTip {
  docType: string;
  title: string;
  items: string[];
}

// 개선 가이드
export interface ImprovementGuide {
  id: string;
  title: string;
  description: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface SummaryItem {
  id?: string;
  title?: string;
  content: string;
}

// ==================== API 함수 ====================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const analyzeAPI = {
  /**
   * 문서 분석 요청
   * POST /api/analyze
   */
  requestAnalysis: async (documentId: string, editedText?: string): Promise<AnalyzeResponse> => {
    return apiClient<AnalyzeResponse>('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ documentId, ...(editedText && { editedText }) }),
    });
  },

  /**
   * 분석 결과 조회
   * GET /api/result/:analysisId
   */
  getAnalysisResult: async (analysisId: string): Promise<AnalysisResult> => {
    return apiClient<AnalysisResult>(`/api/result/${analysisId}`);
  },
};