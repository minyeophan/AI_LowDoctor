import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FloatingButtons.css';
import { GoBellFill } from "react-icons/go";
import { FaSave } from "react-icons/fa";
import { IoLogOut } from "react-icons/io5";
import { IoMdCheckmark, IoIosExit } from "react-icons/io";
import { IoMdShare } from "react-icons/io";
import ChatbotLogo from '../../../assets/img/ChatbotLogo.svg';
import { useDocument } from '../../../context/DocumentContext';
import { BsFillPeopleFill } from "react-icons/bs";
import { mypageAPI } from '../../../api/mypage';
import { communityAPI } from '../../../api/community';
import { RiskItem } from '../../../api/analyze';

type SidebarType = 'chatbot' | 'notification' | 'search' | null;

interface FloatingButtonsProps {
  activeSidebar: SidebarType;
  onToggle: (type: 'chatbot' | 'notification' | 'search') => void;
  riskItems?: RiskItem[];
  documentFilename?: string;
}

const SEVERITY_LABEL: Record<string, string> = {
  high: '높음',
  medium: '중간',
  low: '낮음',
  HIGH: '높음',
  MEDIUM: '중간',
  LOW: '낮음',
};

const SEVERITY_ORDER: Record<string, number> = {
  high: 0, HIGH: 0,
  medium: 1, MEDIUM: 1,
  low: 2, LOW: 2,
};

// 선택된 항목들로 textarea 본문 생성 — 원래 순서 유지, 위험조항+이유만 표시
const buildContentFromSelected = (items: RiskItem[], selectedIds: string[]): string => {
  const selected = items.filter((item, idx) => selectedIds.includes(item.id ?? item.clauseText ?? String(idx)));

  return selected
    .map((item, idx) => {
      const severity = item.severity ?? item.riskLevel ?? '';
      const clauseText = item.clauseText ?? item.description ?? '';
      const reason = item.reason ?? '';

      const lines = [
        `${idx + 1}. [${SEVERITY_LABEL[severity] ?? severity}]`,
        clauseText ? `위험 조항: ${clauseText}` : '',
        reason ? `위험 원인: ${reason}` : '',
      ].filter(Boolean);
      return lines.join('\n');
    })
    .join('\n\n');
};

function FloatingButtons({ activeSidebar, onToggle, riskItems = [], documentFilename }: FloatingButtonsProps) {
  const navigate = useNavigate();
  const { currentDocument, setCurrentDocument } = useDocument();
  const [showExitModal, setShowExitModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSaveComplete, setShowSaveComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [showShareModal, setShowShareModal] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareTitle, setShareTitle] = useState('');
  const [shareContent, setShareContent] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  const showToast = (msg: string) => {
    setShareToast(msg);
    setTimeout(() => setShareToast(null), 3000);
  };

  // 선택 항목 변경 시 textarea 자동 업데이트
  useEffect(() => {
    if (showShareModal) {
      setShareContent(buildContentFromSelected(riskItems, selectedIds));
    }
  }, [selectedIds, showShareModal]);

  const handleShareClick = () => {
    if (!currentDocument) {
      showToast('먼저 계약서를 업로드해주세요.');
      return;
    }
    if (!riskItems || riskItems.length === 0) {
      showToast('위험 조항 분석 후 공유할 수 있습니다.');
      return;
    }
    // 모달 초기화
    setSelectedIds([]);
    setShareTitle('');
    setShareContent('');
    setShareError(null);
    setPrivacyAgreed(false);
    setShowShareModal(true);
  };

  const handleToggleItem = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allIds = riskItems.map((item, idx) => item.id ?? item.clauseText ?? String(idx));
    if (selectedIds.length === allIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allIds);
    }
  };

  const handleExit = () => {
    setCurrentDocument(null);
    navigate('/');
  };

  const handleSaveConfirm = async () => {
    if (!currentDocument?.documentId) {
      alert('문서 ID를 찾을 수 없습니다.');
      setShowSaveModal(false);
      return;
    }
    setIsSaving(true);
    try {
      await mypageAPI.saveDocument(currentDocument.documentId);
      setShowSaveModal(false);
      setShowSaveComplete(true);
      setTimeout(() => {
        setShowSaveComplete(false);
        setCurrentDocument(null);
        navigate('/mypage');
      }, 2000);
    } catch (error) {
      console.error('저장 실패:', error);
      alert(`저장 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      setShowSaveModal(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareConfirm = async () => {
    if (!shareTitle.trim()) {
      setShareError('제목을 입력해주세요.');
      return;
    }
    if (!shareContent.trim()) {
      setShareError('공유할 내용을 선택하거나 입력해주세요.');
      return;
    }
    setIsSharing(true);
    setShareError(null);
    try {
      await communityAPI.createPost({
        title: shareTitle,
        category: '부동산',
        content: shareContent,
      });
      setShowShareModal(false);
      showToast('커뮤니티에 공유되었습니다 ✓');
    } catch (error) {
      console.error('공유 실패:', error);
      setShareError(error instanceof Error ? error.message : '공유 중 오류가 발생했습니다.');
    } finally {
      setIsSharing(false);
    }
  };

  // 위험도 순 정렬 (높음 → 중간 → 낮음)
  const sortedRiskItems = [...riskItems].sort(
    (a, b) =>
      (SEVERITY_ORDER[a.severity ?? a.riskLevel ?? ''] ?? 9) -
      (SEVERITY_ORDER[b.severity ?? b.riskLevel ?? ''] ?? 9)
  );

  return (
    <>
      <div className="floating-buttons-container">
        <div className="floating-buttons">
          <button
            className={`floating-btn ${activeSidebar === 'chatbot' ? 'active' : ''}`}
            onClick={() => onToggle('chatbot')}
            title="챗봇"
          >
            <img src={ChatbotLogo} width={16} />
            <span className="fbtn-span">챗봇</span>
          </button>
          <button
            className={`floating-btn ${activeSidebar === 'search' ? 'active' : ''}`}
            onClick={() => onToggle('search')}
            title="사례검색"
          >
            <BsFillPeopleFill size={18} color={'#855be1'} />
            <span className="fbtn-span">사례</span>
          </button>
          <button
            className={`floating-btn ${activeSidebar === 'notification' ? 'active' : ''}`}
            onClick={() => onToggle('notification')}
            title="일정"
          >
            <GoBellFill size={20} color="FFC908" />
            <span className="fbtn-span">일정</span>
          </button>
        </div>

        <div className="floating-buttons-bottom">
          <button
            className="floating-btn shared-btn"
            title="커뮤니티에 공유"
            onClick={handleShareClick}
          >
            <IoMdShare size={18} color="#FFFFFF" />
            <span className="fbtn-span">공유</span>
          </button>
          <button
            className="floating-btn save-btn"
            title="저장"
            onClick={() => setShowSaveModal(true)}
            disabled={!currentDocument || isSaving}
          >
            <FaSave size={17} color="#FFFFFF" />
            <span className="fbtn-span">{isSaving ? '저장중...' : '저장'}</span>
          </button>
          <button
            className="floating-btn exit-btn"
            title="나가기"
            onClick={() => setShowExitModal(true)}
          >
            <IoLogOut size={19} color="#FFFFFF" />
            <span className="fbtn-span">나가기</span>
          </button>
        </div>
      </div>

      {/* 나가기 모달 */}
      {showExitModal && (
        <div className="exit-modal-overlay">
          <div className="exit-modal">
            <div className="modal-icon modal-icon-danger">
              <IoIosExit size={32} color="#E53E3E" />
            </div>
            <p className="exit-modal-text">나가시겠습니까?</p>
            <p className="exit-modal-sub">분석 중인 내용이 저장되지 않을 수 있습니다.</p>
            <div className="exit-modal-buttons">
              <button className="exit-cancel-btn" onClick={() => setShowExitModal(false)}>취소</button>
              <button className="exit-confirm-btn" onClick={handleExit}>나가기</button>
            </div>
          </div>
        </div>
      )}

      {/* 저장 모달 */}
      {showSaveModal && (
        <div className="save-modal-overlay">
          <div className="save-modal">
            <div className="modal-icon modal-icon-save">
              <FaSave size={28} color="#4099FD" />
            </div>
            <p className="save-modal-text">저장하시겠습니까?</p>
            <p className="save-modal-sub">분석 결과가 보관함에 저장됩니다.</p>
            <div className="save-modal-buttons">
              <button className="save-cancel-btn" onClick={() => setShowSaveModal(false)} disabled={isSaving}>취소</button>
              <button className="save-confirm-btn" onClick={handleSaveConfirm} disabled={isSaving}>
                {isSaving ? '저장중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 저장 완료 모달 */}
      {showSaveComplete && (
        <div className="save-modal-overlay">
          <div className="save-modal">
            <div className="modal-icon modal-icon-save">
              <IoMdCheckmark size={32} color="#4099FD" />
            </div>
            <p className="save-modal-text" style={{ margin: 0 }}>저장되었습니다</p>
          </div>
        </div>
      )}

      {/* 공유 모달 */}
      {showShareModal && (
        <div className="save-modal-overlay">
          <div className="share-modal">

            {/* 헤더 */}
            <div className="share-modal-header">
              <IoMdShare size={20} color="#4099FD" />
              <p className="save-modal-text" style={{ margin: 0 }}>커뮤니티에 공유</p>
            </div>

            <div className="share-modal-body">
              {/* 왼쪽: 조항 선택 */}
              <div className="share-left">
                <div className="share-section-label">
                  <span>공유할 위험 조항 선택</span>
                  <button className="share-select-all" onClick={handleSelectAll}>
                    {selectedIds.length === riskItems.length ? '전체 해제' : '전체 선택'}
                  </button>
                </div>
                <div className="share-item-list">
                  {sortedRiskItems.map((item, idx) => {
                    const severity = item.severity ?? item.riskLevel ?? '';
                    const itemId = item.id ?? item.clauseText ?? String(idx);
                    const isSelected = selectedIds.includes(itemId);
                    return (
                      <div
                        key={itemId}
                        className={`share-item-card ${isSelected ? 'selected' : ''} severity-${severity.toLowerCase()}`}
                        onClick={() => handleToggleItem(itemId)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleItem(itemId)}
                          onClick={e => e.stopPropagation()}
                          className="share-item-checkbox"
                        />
                        <div className="share-item-info">
                          <div className="share-severity-row">
                            <span className={`share-dot share-dot-${severity.toLowerCase()}`} />
                            <span className="share-severity-badge">
                              {SEVERITY_LABEL[severity] ?? severity}
                            </span>
                          </div>
                          <p className="share-description">
                            {((item.clauseText ?? item.description ?? '')).slice(0, 60)}
                            {(item.clauseText ?? item.description ?? '').length > 60 ? '...' : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 오른쪽: 제목 + 본문 편집 */}
              <div className="share-right">
                <div className="share-section-label">
                  <span>게시글 편집</span>
                  <span className="share-edit-hint">내용을 자유롭게 수정할 수 있습니다</span>
                </div>
                <input
                  className="share-title-input"
                  value={shareTitle}
                  onChange={e => setShareTitle(e.target.value)}
                  placeholder="제목을 입력하세요"
                  maxLength={100}
                />
                <textarea
                  className="share-content-textarea"
                  value={shareContent}
                  onChange={e => setShareContent(e.target.value)}
                  placeholder="공유할 내용이 여기에 표시됩니다"
                  rows={14}
                />
              </div>
            </div>

            {shareError && <p className="share-error">{shareError}</p>}

             {/* 개인정보 동의 */}
            
              <div className='save-modal-buttons-wrap'>
                <div className="share-privacy-check">
              <input
                type="checkbox"
                id="share-privacy"
                checked={privacyAgreed}
                onChange={e => setPrivacyAgreed(e.target.checked)}
              />
              <label htmlFor="share-privacy">
                개인정보(주소·이름·금액 등)가 포함되지 않았음을 확인했습니다.
              </label>
            </div>
            <div className="save-modal-buttons">
              <button
                className="save-cancel-btn"
                onClick={() => { setShowShareModal(false); setShareError(null); }}
                disabled={isSharing}
              >
                취소
              </button>
              <button
                className="save-confirm-btn"
                onClick={handleShareConfirm}
                disabled={isSharing || selectedIds.length === 0 || !shareTitle.trim() || !shareContent.trim() || !privacyAgreed}
              >
                {isSharing ? '공유중...' : `공유하기 (${selectedIds.length}건)`}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 */}
      {shareToast && (
        <div className="share-toast">
          <IoMdCheckmark size={16} color="#fff" />
          {shareToast}
        </div>
      )}
    </>
  );
}

export default FloatingButtons;