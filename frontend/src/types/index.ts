// 공통으로 사용하는 TypeScript 타입 정의

export interface UploadResult {
  file: File;
  success: boolean;
}

export interface DocumentData {
  documentId: string;
  filename: string;
  size: number;
  uploadDate: string;
  content: string;
  file: File;
}