import { useState, useEffect, useRef } from 'react';
import { BsFillPrinterFill } from "react-icons/bs";
import { RiEditBoxFill } from "react-icons/ri";
import DocumentEditor, { DocumentEditorRef } from './DocumentEditor';
import { FaCaretUp } from "react-icons/fa";
import { FaCaretDown } from "react-icons/fa";
import { IoMdSearch } from "react-icons/io";
import '../views/DocumentView.css';

interface Memo {
  id: string;
  text: string;
  createdAt: string;
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
  editedHtml: string;
  editorRef: React.RefObject<DocumentEditorRef>;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

function DocumentView({
  currentDocument, zoomLevel, onZoomIn, onZoomOut,
  editedHtml, editorRef, onAnalyze, isAnalyzing
}: DocumentViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const editorBodyRef = useRef<HTMLDivElement>(null);
  const memoPanelRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  // 메모 상태
  const [memos, setMemos] = useState<Memo[]>([]);
  const [showMemoPanel, setShowMemoPanel] = useState(false);
  const [memoInput, setMemoInput] = useState('');

  // 검색어 변경 시 하이라이팅 개수 카운트
  useEffect(() => {
    if (!searchTerm.trim()) {
      setMatchCount(0);
      setCurrentSearchIndex(0);
      return;
    }
    setTimeout(() => {
      const highlights = document.querySelectorAll('.search-highlight');
      setMatchCount(highlights.length);
      setCurrentSearchIndex(0);
    }, 150);
  }, [searchTerm]);

  const handleSearchPrev = () => {
    const highlights = document.querySelectorAll('.search-highlight');
    if (highlights.length === 0) return;
    const newIndex = currentSearchIndex > 0 ? currentSearchIndex - 1 : highlights.length - 1;
    setCurrentSearchIndex(newIndex);
    highlights[newIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleSearchNext = () => {
    const highlights = document.querySelectorAll('.search-highlight');
    if (highlights.length === 0) return;
    const newIndex = currentSearchIndex < highlights.length - 1 ? currentSearchIndex + 1 : 0;
    setCurrentSearchIndex(newIndex);
    highlights[newIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
  if (!memoPanelRef.current) return;
  isDragging.current = true;
  const rect = memoPanelRef.current.getBoundingClientRect();
  dragOffset.current = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
  e.preventDefault();
};

const handleDragMove = (e: MouseEvent) => {
  if (!isDragging.current || !memoPanelRef.current) return;
  memoPanelRef.current.style.left = `${e.clientX - dragOffset.current.x}px`;
  memoPanelRef.current.style.top = `${e.clientY - dragOffset.current.y}px`;
};

const handleDragEnd = () => {
  isDragging.current = false;
};

useEffect(() => {
  window.addEventListener('mousemove', handleDragMove);
  window.addEventListener('mouseup', handleDragEnd);
  return () => {
    window.removeEventListener('mousemove', handleDragMove);
    window.removeEventListener('mouseup', handleDragEnd);
  };
}, []);

  // 메모
  const handleAddMemo = () => {
    if (!memoInput.trim()) return;
    const newMemo: Memo = {
      id: Date.now().toString(),
      text: memoInput,
      createdAt: new Date().toLocaleString('ko-KR'),
    };
    setMemos(prev => [...prev, newMemo]);
    setMemoInput('');
  };

  const handleDeleteMemo = (id: string) => {
    setMemos(prev => prev.filter(m => m.id !== id));
  };


  // 인쇄
  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write('<html><head><title>인쇄</title>');
      printWindow.document.write('<style>body { font-family: "Noto Sans KR", sans-serif; line-height: 1.8; padding: 20px; }</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write(`<h2>${currentDocument.filename}</h2>`);
      printWindow.document.write(editedHtml);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="content-section">
      <div className="content-analysis-box">

        {/* 툴바 */}
        <div className="document-toolbar-new">

          {/* 검색창 */}
          <div className="search-box-new">
            <IoMdSearch color='#666'/>
            <input
              type="text"
              placeholder="내용을 검색하세요"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-new"
            />
            {searchTerm && (
              <div className="search-results">
                <span className="search-count">{matchCount}개</span>
                <div className='search-btn-wrap'>
                  <button onClick={handleSearchPrev} disabled={matchCount === 0}><FaCaretUp size={16}/></button>
                  <button onClick={handleSearchNext} disabled={matchCount === 0}><FaCaretDown size={16}/></button>
                </div>
              </div>
            )}
          </div>

          {/* 우측 아이콘들 */}
          <div className="toolbar-actions">
             {/* 맨위로/맨아래로 */}
            <button
              className="scroll-btn"
              onClick={() => editorBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              title="맨 위로"
            ><FaCaretUp size={22}/></button>
            <button
              className="scroll-btn"
              onClick={() => editorBodyRef.current?.scrollTo({ top: 99999, behavior: 'smooth' })}
              title="맨 아래로"
            ><FaCaretDown size={22}/></button>

            <button
              className={`icon-btn ${showMemoPanel ? 'active' : ''}`}
              onClick={() => { setShowMemoPanel(!showMemoPanel); }}
              title="메모"
            >
              <RiEditBoxFill size={14} />
            </button>
            <button className="icon-btn" onClick={handlePrint} title="인쇄">
              <BsFillPrinterFill size={14} />
            </button>
          </div>
        </div>

        {/* 메모 패널 */}
        {showMemoPanel && (
        <div className="side-panel" ref={memoPanelRef}>
          <div
            className="panel-header draggable"
            onMouseDown={handleDragStart}
          >
            <span>메모</span>
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
        {/* 문서 본문 */}
        <div className="document-body" ref={editorBodyRef}>
          <DocumentEditor
            ref={editorRef}
            initialContent={editedHtml}
            searchTerm={searchTerm}
            zoomLevel={zoomLevel}
          />
        </div>

      </div>
    </div>
  );
}

export default DocumentView;