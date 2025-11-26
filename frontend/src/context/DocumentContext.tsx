import { createContext, useContext, useState, ReactNode, useMemo } from 'react';

export interface DocumentData {
  documentId: string;
  filename: string;
  size: number;
  uploadDate: string;
  content: string;
  file: File;
}

interface DocumentContextType {
  currentDocument: DocumentData | null;
  setCurrentDocument: (doc: DocumentData | null) => void;
  uploadDocument: (file: File) => Promise<DocumentData>;
  fetchDocument: (documentId: string) => Promise<DocumentData>;
  isLoading: boolean;
  error: string | null;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

// 백엔드 API URL
const API_BASE_URL = 'http://localhost:3001/api'; // 백엔드 포트에 맞게 수정

interface DocumentProviderProps {
  children: ReactNode;
}

export function DocumentProvider({ children }: DocumentProviderProps) {
  const [currentDocument, setCurrentDocument] = useState<DocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 문서 업로드 함수
  const uploadDocument = async (file: File): Promise<DocumentData> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/upload`,  {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('문서 업로드에 실패했습니다.');
      }

      const data = await response.json();

      const documentData: DocumentData = {
      documentId: data.document_id,  // document_id (언더스코어)
      filename: file.name,            // 백엔드에서 안 보내주므로 file에서 가져오기
      size: file.size,                // 백엔드에서 안 보내주므로 file에서 가져오기
      uploadDate: new Date().toISOString(), // 현재 시간
      content: '',                    // 빈 문자열
      file: file,
    };

      setCurrentDocument(documentData);
      return documentData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 문서 조회 함수
  const fetchDocument = async (documentId: string): Promise<DocumentData> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}`);

      if (!response.ok) {
        throw new Error('문서를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      
      const documentData: DocumentData = {
        documentId: data.documentId,
        filename: data.filename,
        size: data.size,
        uploadDate: data.uploadDate,
        content: data.content,
        file: data.file, // 백엔드에서 File 객체를 어떻게 보내주는지에 따라 수정 필요
      };

      setCurrentDocument(documentData);
      return documentData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      currentDocument,
      setCurrentDocument,
      uploadDocument,
      fetchDocument,
      isLoading,
      error,
    }),
    [currentDocument, isLoading, error]
  );

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocument(): DocumentContextType {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocument must be used within DocumentProvider');
  }
  return context;
}