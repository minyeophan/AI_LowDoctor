import { 
  mockDocumentContent, 
  mockAnalysisResult, 
} from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const USE_MOCK = !API_BASE_URL;
const USE_MOCK_AI = true; //ai 연결시 true -> false로 변경해야함

// 에러 클래스
export class ApiError extends Error {
  code: number;
  
  constructor(message: string, code: number) {
    super(message);
    this.code = code;
    this.name = 'ApiError';
  }
}

// 타입 정의

// 파일 업로드
export interface UploadResponse {
  document_id: string;
  status: string;
  content?: string;
}

// 요약
export interface SummaryItem {
  title: string;
  content: string;
}

// 위험 탐지 
export interface RiskItem {
  id: number;
  clauseText: string;
  riskLevel: 'high' | 'medium' | 'low';
  reason: string;
  guide: string;
}

// 문서 정보
export interface FormItem {
  type: string;
  description: string;
  downloadUrl: string;
}

// 대응가이드 
export interface ImprovementGuide {
  id: number;
  page?: number;
  originalClause: string;
  checkPoints: string[];
  improvedClause: string;
}

export interface AnalysisResponse {
  summary: SummaryItem[];
  riskItems: RiskItem[];
  recommendations: string[];
  forms: FormItem[];
  analyzedAt: string;
  contractTip?: ContractTip;
  improvementGuides?: ImprovementGuide[]; 
}

// 계약서 종류별 팁
export interface ContractTip {
  docType: string;
  title: string;
  items: string[];
}


// 파일 내용 읽기 함수
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    
    reader.onerror = () => {
      // 읽기 실패 시 Mock 내용 사용
      resolve(mockDocumentContent);
    };

    const fileName = file.name.toLowerCase();
    
    // 텍스트 파일은 직접 읽기
    if (fileName.endsWith('.txt') || file.type.startsWith('text/')) {
      reader.readAsText(file);
    } else if (fileName.endsWith('.pdf')) {
      // mock 데이터 바로 표시
      resolve(mockDocumentContent);
    } else if (fileName.endsWith('.hwp') || fileName.endsWith('.hwpx')) {
      resolve(`[HWP 파일]\n\n📄 파일명: ${file.name}\n📦 크기: ${(file.size / 1024).toFixed(2)} KB\n\n⚠️ HWP 내용 표시는 백엔드 연결이 필요합니다.\n\n--- Mock 데이터 ---\n\n${mockDocumentContent}`);
    } else {
      resolve(`[${file.type || '알 수 없는'} 파일]\n\n📄 파일명: ${file.name}\n📦 크기: ${(file.size / 1024).toFixed(2)} KB\n\n--- Mock 데이터 ---\n\n${mockDocumentContent}`);
    }
  });
};

// API 함수들
export const api = {
  // 파일 업로드 (백엔드 연결)
  uploadDocument: async (file: File): Promise<UploadResponse> => {
    // Mock 모드
    if (USE_MOCK) {
      console.log(' Mock 모드: 파일 업로드');
      await new Promise(r => setTimeout(r, 1000));
      // 파일 내용 읽기
      const content = await readFileAsText(file);
      return {
        document_id: `mock-${Date.now()}`,
        status: 'uploaded',
        content: content,
      };
    }

    // 실제 API 호출
    console.log('실제 API: 파일 업로드');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('파일 업로드에 실패했습니다.');
      }
      const result = await response.json();
      console.log('✅ 백엔드 응답:', result);

      // 클라이언트에서 파일 내용 읽기
      const content = await readFileAsText(file);
      console.log('✅ 파일 내용 읽기 완료');

      return {
        document_id: result.document_id,
        status: result.status,
        content: content,
      };

      // return response.json();

    } catch (error) {
      console.error('업로드 에러:', error);
      throw new ApiError('파일 업로드에 실패했습니다.', 500);
    }
  },


  // AI 분석 요청
  analyzeText: async (text: string): Promise<AnalysisResponse> => {
    console.log('AI 분석: Mock 데이터 사용 (AI 파트 미연결)');

     // Mock 모드
  if (USE_MOCK_AI) {
    console.log('Mock 모드: AI 분석 (AI 파트 미연결)');
    console.log('나중에 USE_MOCK_AI = false로 변경하면 실제 AI 사용');
    
    await new Promise(r => setTimeout(r, 2000));
    return {
      ...mockAnalysisResult,
      analyzedAt: new Date().toISOString(),
    };
  }
    // 실제 API 호출
     console.log('🚀 실제 AI API 호출');
    
    try {
      const response = await fetch(`${API_BASE_URL}/analyze-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('분석 요청에 실패했습니다.');
      }
      const result = await response.json();
      return result.data;
      
    } catch (error) {
      console.error('분석 에러:', error);
      throw new ApiError('AI 분석에 실패했습니다.', 500);
    }
  },
};

export default api;