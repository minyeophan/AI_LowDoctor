import { useState, useMemo, useEffect } from 'react';
import DocumentMeta from '../shared/DocumentMeta';
import { FiSearch, FiPrinter, FiFileText } from 'react-icons/fi';
import { BsFillPrinterFill } from "react-icons/bs";
import { RiEditBoxFill } from "react-icons/ri";
import { FaBookmark } from "react-icons/fa";
import { MdOutlineTextFields } from 'react-icons/md';
import '../views/DocumentView.css';

interface Memo {
  id: string;
  text: string;
  page: number;
  createdAt: string;
}

interface Bookmark {
  page: number;
  label: string;
}

interface DocumentViewProps {
  currentDocument: {
    content: string;
    uploadDate: string;
    filename: string;
    size?: number;
    fileUrl?: string;
  };
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

function DocumentView({ currentDocument, zoomLevel, onZoomIn, onZoomOut }: DocumentViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  // 메모 상태
  const [memos, setMemos] = useState<Memo[]>([]);
  const [showMemoPanel, setShowMemoPanel] = useState(false);
  const [memoInput, setMemoInput] = useState('');

  // 북마크 상태
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showBookmarkPanel, setShowBookmarkPanel] = useState(false);

  const linesPerPage = 40;

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
  const isCurrentPageBookmarked = bookmarks.some(b => b.page === currentPage);

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
      if (results.length > 0) setCurrentPage(results[0]);
    } else {
      setSearchResults([]);
      setCurrentSearchIndex(0);
    }
  }, [searchTerm, pages]);

  const handlePrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));

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

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? <mark key={index} className="highlight">{part}</mark> : part
    );
  };

  // 메모 추가
  const handleAddMemo = () => {
    if (!memoInput.trim()) return;
    const newMemo: Memo = {
      id: Date.now().toString(),
      text: memoInput,
      page: currentPage,
      createdAt: new Date().toLocaleString('ko-KR'),
    };
    setMemos(prev => [...prev, newMemo]);
    setMemoInput('');
  };

  const handleDeleteMemo = (id: string) => {
    setMemos(prev => prev.filter(m => m.id !== id));
  };

  // 북마크 토글
  const handleToggleBookmark = () => {
    if (isCurrentPageBookmarked) {
      setBookmarks(prev => prev.filter(b => b.page !== currentPage));
    } else {
      setBookmarks(prev => [...prev, { page: currentPage, label: `${currentPage}페이지` }]);
    }
  };

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
      <div className="content-analysis-box">
        {/* 툴바 */}<div className="document-info-header">
      </div>
        <div className="document-toolbar-new">
          {/* 검색창 */}
          <div className="search-box-new">
            
            <input
              type="text"
              placeholder="내용을 검색하세요"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-new"
            />
            <FiSearch className="search-icon" size={16} />
            {searchResults.length > 0 && (
              <div className="search-results">
                <span>{currentSearchIndex + 1}/{searchResults.length}</span>
                <button onClick={handleSearchPrev}>▲</button>
                <button onClick={handleSearchNext}>▼</button>
              </div>
            )}
          </div>

          {/* 우측 아이콘들 */}
          <div className="toolbar-actions">
            {/* 메모 */}
            <button
              className={`icon-btn ${showMemoPanel ? 'active' : ''}`}
              onClick={() => { setShowMemoPanel(!showMemoPanel); setShowBookmarkPanel(false); }}
              title="메모"
            >
              <RiEditBoxFill size={16} />
            </button>

            {/* 북마크 */}
            <button
              className={`icon-btn ${isCurrentPageBookmarked ? 'bookmarked' : ''}`}
              onClick={() => { setShowBookmarkPanel(!showBookmarkPanel); setShowMemoPanel(false); }}
              title="북마크"
            >
              <FaBookmark  size={16} />
            </button>

            {/* 인쇄 */}
            <button className="icon-btn" onClick={handlePrint} title="인쇄">
              <BsFillPrinterFill size={16} />
            </button>
          </div>
        </div>

        {/* 메모 패널 */}
        {showMemoPanel && (
          <div className="side-panel">
            <div className="panel-header">
              <span>📝 메모 ({currentPage}페이지)</span>
              <button onClick={() => setShowMemoPanel(false)}>✕</button>
            </div>
            <div className="memo-input-box">
              <textarea
                value={memoInput}
                onChange={(e) => setMemoInput(e.target.value)}
                placeholder="메모를 입력하세요..."
                rows={3}
              />
              <button className="memo-add-btn" onClick={handleAddMemo}>추가</button>
            </div>
            <div className="memo-list">
              {memos.length === 0 ? (
                <p className="empty-msg">메모가 없습니다.</p>
              ) : (
                memos.map(memo => (
                  <div key={memo.id} className="memo-item">
                    <div className="memo-meta">
                      <span className="memo-page">{memo.page}페이지</span>
                      <span className="memo-date">{memo.createdAt}</span>
                    </div>
                    <p className="memo-text">{memo.text}</p>
                    <button className="memo-delete" onClick={() => handleDeleteMemo(memo.id)}>삭제</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 북마크 패널 */}
        {showBookmarkPanel && (
          <div className="side-panel">
            <div className="panel-header">
              <span>🔖 북마크</span>
              <button onClick={() => setShowBookmarkPanel(false)}>✕</button>
            </div>
            <button
              className={`bookmark-toggle-btn ${isCurrentPageBookmarked ? 'remove' : 'add'}`}
              onClick={handleToggleBookmark}
            >
              {isCurrentPageBookmarked ? '🔖 현재 페이지 북마크 해제' : '🔖 현재 페이지 북마크 추가'}
            </button>
            <div className="bookmark-list">
              {bookmarks.length === 0 ? (
                <p className="empty-msg">북마크가 없습니다.</p>
              ) : (
                bookmarks.map((bm, idx) => (
                  <div key={idx} className="bookmark-item" onClick={() => { setCurrentPage(bm.page); setShowBookmarkPanel(false); }}>
                    <FaBookmark size={14} />
                    <span>{bm.label}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 문서 본문 */}
       {/* 문서 본문 */}
<div className="document-body">
  {currentDocument.content ? (
    <>
      <pre style={{ fontSize: `${zoomLevel}%` }}>
        {searchTerm ? highlightText(pages[currentPage - 1] || '', searchTerm) : pages[currentPage - 1] || ''}
      </pre>
      {/* 페이지 네비게이션 */}
      {totalPages > 1 && (
        <div className="page-navigation">
          {/* 줌 컨트롤 */}
          <div className="page-nav-zoom">
            <button className="zoom-btn" onClick={onZoomOut}>－</button>
            <span className="zoom-level">{zoomLevel}%</span>
            <button className="zoom-btn" onClick={onZoomIn}>＋</button>
          </div>
          {/* 페이지 이동 */}
          <div className="page-nav-right">
            <button className="page-arrow-btn" onClick={handlePrevPage} disabled={currentPage === 1}>‹</button>
            <span className="page-current-total">
              <strong>{currentPage}</strong> / {totalPages}
            </span>
            <button className="page-arrow-btn" onClick={handleNextPage} disabled={currentPage === totalPages}>›</button>
          </div>
        </div>
      )}
    </>
  ) : (
    <p className="no-content">문서 내용을 불러오는 중입니다...</p>
  )}
</div>
      </div>
    </div>
  );
}

export default DocumentView;