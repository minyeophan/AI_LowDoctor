

// src/api/documents.ts

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3001';

export interface UploadResponse {
  success: boolean;
  documentId?: string;
  document_id?: string;
  fileName?: string;
  file_name?: string;
  fileSize?: number;
  content?: string;
  uploadedAt?: string;
  message?: string;
  status?: string;
}

export const documentsAPI = {
  convertDocument: async (documentId: string): Promise<{ html: string }> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({ documentId }),
    });
    if (!response.ok) throw new Error('문서 변환에 실패했습니다.');
    return response.json();
  },

  uploadDocument: async (file: File): Promise<UploadResponse> => {
    console.log('🚀 업로드 시작:', {
      fileName: file.name,
      fileSize: file.size,
      apiUrl: `${API_BASE_URL}/api/upload`,
    });

    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData,
      });

      console.log('📡 응답 상태:', response.status, response.statusText);

      // 응답 텍스트 먼저 확인
      const responseText = await response.text();
      console.log('📄 응답 원본:', responseText);

      if (!response.ok) {
        let errorMessage = '파일 업로드에 실패했습니다.';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `서버 오류 (${response.status}): ${responseText}`;
        }
        throw new Error(errorMessage);
      }

      // JSON 파싱
      const data = JSON.parse(responseText);
      console.log('✅ 파싱된 응답:', data);

      return data;
      
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      throw error;
    }
  },
};

