import './AnalysisConfirmModal.css';

interface AnalysisConfirmModalProps {
  type: 'summary' | 'danger' | 'guide';
  onConfirm: () => void;
  onCancel: () => void;
}

function AnalysisConfirmModal({ type, onConfirm, onCancel }: AnalysisConfirmModalProps) {
  const messages = {
    summary: {
      title: '핵심 요약',
      message: '문서의 내용을 핵심 요약 하시겠습니까?',
      icon: '📃'
    },
    danger: {
      title: '위험 탐지',
      message: '문서의 위험 요소를 분석하시겠습니까?',
      icon: '⚠️'
    },
    guide: {
      title: '대응 가이드',
      message: '대응 가이드를 생성하시겠습니까?',
      icon: '📋'
    }
  };

  const { title, message, icon } = messages[type];

  return (
    <div className="analysis-confirm-modal">
      <div className="modal-content">
        <div className="modal-icon">{icon}</div>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-buttons">
          <button className="modal-btn cancel-btn" onClick={onCancel}>
            취소
          </button>
          <button className="modal-btn confirm-btn" onClick={onConfirm}>
            진행하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default AnalysisConfirmModal;