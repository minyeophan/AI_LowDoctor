// src/services/api.ts
// 백엔드 API 통신을 담당하는 서비스

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// API 응답 타입
interface ApiSuccessResponse<T> {
  status: 'success';
  message: string;
  data: T;
}

interface ApiErrorResponse {
  status: 'error';
  message: string;
  code: number;
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// 에러 클래스
export class ApiError extends Error {
  code: number;
  
  constructor(message: string, code: number) {
    super(message);
    this.code = code;
    this.name = 'ApiError';
  }
}

// 기본 fetch 래퍼
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
      },
    });

    const data: ApiResponse<T> = await response.json();

    // 에러 응답 처리
    if (data.status === 'error') {
      throw new ApiError(data.message, data.code);
    }

    // 성공 응답
    return data.data;
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // 네트워크 에러 등
    console.error('API 통신 에러:', error);
    throw new ApiError('서버와 통신할 수 없습니다.', 500);
  }
}

// 파일 업로드 응답 타입
export interface UploadResponse {
  documentId: string;
  filename: string;
  size: number;
  uploadDate: string;
  extractedText: string;
  fileType: string;
}

// AI 분석 응답 타입
export interface AnalysisResponse {
  documentId: string;
  summary: string;
  dangerPoints: Array<{
    category: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    location: string;
  }>;
  recommendations: string[];
  analyzedAt: string;
}

// API 함수들
export const api = {
  // 파일 업로드
  uploadDocument: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    return fetchApi<UploadResponse>('/documents/upload', {
      method: 'POST',
      body: formData,
      // Content-Type은 자동으로 설정됨 (multipart/form-data)
    });
  },

  // 문서 분석 요청 (AI)
  analyzeDocument: async (documentId: string): Promise<AnalysisResponse> => {
    return fetchApi<AnalysisResponse>(`/documents/${documentId}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  // 문서 조회
  getDocument: async (documentId: string): Promise<UploadResponse> => {
    return fetchApi<UploadResponse>(`/documents/${documentId}`, {
      method: 'GET',
    });
  },

  // 문서 삭제
  deleteDocument: async (documentId: string): Promise<{ message: string }> => {
    return fetchApi<{ message: string }>(`/documents/${documentId}`, {
      method: 'DELETE',
    });
  },
};

export default api;