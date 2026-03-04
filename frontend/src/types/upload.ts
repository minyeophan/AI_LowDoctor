// src/types/upload.ts

export interface UploadResult {
  success: boolean;
  documentId?: string;
  fileName?: string;
  fileSize?: number;
  uploadedAt?: string;
  message?: string;
  error?: string;
  file?: File;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  autoAnalyze?: boolean;
}