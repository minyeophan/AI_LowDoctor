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
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

interface DocumentProviderProps {
  children: ReactNode;
}

export function DocumentProvider({ children }: DocumentProviderProps) {
  const [currentDocument, setCurrentDocument] = useState<DocumentData | null>(null);

  const value = useMemo(
    () => ({
      currentDocument,
      setCurrentDocument,
    }),
    [currentDocument]
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