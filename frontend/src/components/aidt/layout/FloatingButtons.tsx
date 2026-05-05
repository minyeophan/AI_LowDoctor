import { useState } from 'react';
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
  high: '⚠️ 높음',
  medium: '🔶 중간',
  low: '🔷 낮음',
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

  const showToast = (msg: string) => {
    setShareToast(msg);
    setTimeout(() => setShareToast(null), 3000);
  };

  const handleShareClick = () => {
    if (!currentDocument) {
      showToast('먼저 계약서를 업로드해주세요.');
      return;
    }
    if (!riskItems || riskItems.length === 0) {
      showToast('위험 조항 분석 후 공유할 수 있습니다.');
      return;
    }
    setShowShareModal(true);
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

  const buildShareContent = () => {
    if (!riskItems || riskItems.length === 0) return '위험 조항이 없습니다.';
    return riskItems
      .map((item) => {
        const lines = [
          `[${SEVERITY_LABEL[item.severity] ?? item.severity}] ${item.category}`,
          item.description,
          item.reason ? `📌 이유: ${item.reason}` : '',
          item.guide
            ? `💡 대응: ${item.guide}`
            : item.recommendation
            ? `💡 권장: ${item.recommendation}`
            : '',
          item.improvedClause ? `✏️ 개선 조항: ${item.improvedClause}` : '',
        ].filter(Boolean);
        return lines.join('\n');
      })
      .join('\n\n---\n\n');
  };

  const handleShareConfirm = async () => {
    setIsSharing(true);
    setShareError(null);
    try {
      await communityAPI.createPost({
        title: `[계약서 분석] ${documentFilename ?? '계약서'} 위험조항 공유`,
        category: '계약정보',
        content: buildShareContent(),
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
            <div className="modal-icon modal-icon-share">
              <IoMdShare size={28} color="#4099FD" />
            </div>
            <p className="save-modal-text">커뮤니티에 공유</p>
            <p className="save-modal-sub">
              위험 조항 {riskItems.length}건을 커뮤니티에 공유합니다.
            </p>
            <div className="share-preview">
              {riskItems.map((item) => (
                <div key={item.id} className={`share-preview-item severity-${item.severity}`}>
                  <span className="share-severity-badge">
                    {SEVERITY_LABEL[item.severity] ?? item.severity}
                  </span>
                  <span className="share-category">{item.category}</span>
                  <p className="share-description">{item.description}</p>
                  {(item.guide || item.recommendation) && (
                    <p className="share-guide">
                      💡 {item.guide || item.recommendation}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {shareError && <p className="share-error">{shareError}</p>}
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
                disabled={isSharing}
              >
                {isSharing ? '공유중...' : '공유하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 — 안내 메시지 및 공유 완료 공용 */}
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