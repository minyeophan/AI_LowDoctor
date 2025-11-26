import { useState, useMemo, useEffect } from 'react';
import DocumentMeta from '../shared/DocumentMeta';
import { FiSearch, FiDownload, FiPrinter, FiEye, FiFileText } from 'react-icons/fi';
import { MdOutlineTextFields } from 'react-icons/md';
import '../views/DocumentView.css';

interface DocumentViewProps {
  currentDocument: {
    content: string;
    uploadDate: string;
    filename: string;
    size?: number;
    fileUrl?: string; // PDF 원본 URL
  };
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

function DocumentView({ 
  currentDocument, 
  zoomLevel, 
  onZoomIn, 
  onZoomOut 
}: DocumentViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'text' | 'original'>('text');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const linesPerPage = 40;

  // 문서를 페이지로 분할
  const pages = useMemo(() => {
    if (!currentDocument.content) return [];
    const lines = currentDocument.content.split('\n');
    const pageArray = [];
    for (let i = 0; i < lines.length; i += linesPerPage) {
      pageArray.push(lines.slice(i, i + linesPerPage).join('\n'));
    }
    return pageArray;
  }, [currentDocument.content]);

  const totalPages = pages.length || 1;

  // 검색 기능
  useEffect(() => {
    if (searchTerm.trim()) {
      const results: number[] = [];
      pages.forEach((page, index) => {
        if (page.toLowerCase().includes(searchTerm.toLowerCase())) {
          results.push(index + 1);
        }
      });
      setSearchResults(results);
      setCurrentSearchIndex(0);
      if (results.length > 0) {
        setCurrentPage(results[0]);
      }
    } else {
      setSearchResults([]);
      setCurrentSearchIndex(0);
    }
  }, [searchTerm, pages]);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSearchPrev = () => {
    if (searchResults.length > 0) {
      const newIndex = currentSearchIndex > 0 ? currentSearchIndex - 1 : searchResults.length - 1;
      setCurrentSearchIndex(newIndex);
      setCurrentPage(searchResults[newIndex]);
    }
  };

  const handleSearchNext = () => {
    if (searchResults.length > 0) {
      const newIndex = currentSearchIndex < searchResults.length - 1 ? currentSearchIndex + 1 : 0;
      setCurrentSearchIndex(newIndex);
      setCurrentPage(searchResults[newIndex]);
    }
  };

  // 하이라이트된 텍스트 렌더링
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="highlight">{part}</mark> : 
        part
    );
  };

  // 다운로드 기능
  const handleDownload = () => {
    const blob = new Blob([currentDocument.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentDocument.filename || 'document.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // 인쇄 기능
  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write('<html><head><title>인쇄</title>');
      printWindow.document.write('<style>body { font-family: "Noto Sans KR", sans-serif; line-height: 1.8; padding: 20px; } pre { white-space: pre-wrap; }</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write(`<h2>${currentDocument.filename}</h2>`);
      printWindow.document.write(`<pre>${currentDocument.content}</pre>`);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="content-section">
      {/* 상단 파일 정보 바 */}
      <div className="document-info-header">
        <div className="file-info-compact">
          <span className="filename">{currentDocument.filename}</span>
          <span className="upload-time">
            업로드: {new Date(currentDocument.uploadDate).toLocaleString('ko-KR')}
          </span>
         
        </div>
        
        {/* 툴바 */}
        <div className="document-toolbar">
          {/* 보기 모드 전환 */}
          {currentDocument.fileUrl && (
            <div className="view-mode-toggle">
              <button 
                className={`mode-btn ${viewMode === 'text' ? 'active' : ''}`}
                onClick={() => setViewMode('text')}
                title="텍스트 보기"
              >
                <MdOutlineTextFields size={18} />
                텍스트
              </button>
              <button 
                className={`mode-btn ${viewMode === 'original' ? 'active' : ''}`}
                onClick={() => setViewMode('original')}
                title="원본 보기"
              >
                <FiFileText size={18} />
                원본
              </button>
            </div>
          )}

          {/* 검색 */}
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input 
              type="text"
              placeholder="문서 내 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchResults.length > 0 && (
              <div className="search-results">
                <span>{currentSearchIndex + 1} / {searchResults.length}</span>
                <button onClick={handleSearchPrev} className="search-nav-btn">▲</button>
                <button onClick={handleSearchNext} className="search-nav-btn">▼</button>
              </div>
            )}
          </div>

          {/* 액션 버튼들 */}
          <div className="action-buttons">
            <button onClick={handlePrint} className="action-btn" title="인쇄">
              <FiPrinter size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="content-analysis-box">
        <DocumentMeta 
          filename={currentDocument.filename}
          uploadDate={currentDocument.uploadDate}
          zoomLevel={zoomLevel}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
        />
        
        <div className='document-body'>
          {viewMode === 'text' ? (
            // 텍스트 모드
            currentDocument.content ? (
              <>
                <pre style={{ fontSize: `${zoomLevel}%` }}>
                  {searchTerm ? highlightText(pages[currentPage - 1] || '', searchTerm) : pages[currentPage - 1] || ''}
                </pre>
                
                {/* 페이지 네비게이션 */}
                {totalPages > 1 && (
                  <div className="page-navigation">
                    <button 
                      className="page-btn"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                    >
                      ◀ 이전
                    </button>
                    
                    <div className="page-info">
                      <input 
                        type="number" 
                        value={currentPage}
                        onChange={handlePageInput}
                        min={1}
                        max={totalPages}
                        className="page-input"
                      />
                      <span className="page-total">/ {totalPages}</span>
                    </div>
                    
                    <button 
                      className="page-btn"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      다음 ▶
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="no-content">문서 내용을 불러오는 중입니다...</p>
            )
          ) : (
            // 원본 모드 (PDF)
            <div className="document-original">
              {currentDocument.fileUrl ? (
                <embed 
                  src={currentDocument.fileUrl} 
                  type="application/pdf"
                  width="100%"
                  height="800px"
                />
              ) : (
                <p className="no-content">원본 파일을 불러올 수 없습니다.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DocumentView;