import './AnalysisConfirmModal.css';
import ModalIcon from '../../../assets/img/ModalIcon.svg';

interface AnalysisConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

function AnalysisConfirmModal({ onConfirm, onCancel }: AnalysisConfirmModalProps) {
  return (
    <div className="analysis-confirm-modal">
      <div className="modal-content">
        <div className="modal-icon"><img src={ModalIcon} width={24} /></div>
        <h3 className="modal-title">AI 분석 시작</h3>
        <p className="modal-message">
          계약서를 AI로 분석합니다.<br />
          핵심요약, 위험탐지, 대응가이드가 한번에 생성됩니다.
        </p>
        <div className="modal-buttons">
          <button className="modal-btn cancel-btn" onClick={onCancel}>
            취소
          </button>
          <button className="modal-btn confirm-btn" onClick={onConfirm}>
            분석 시작
          </button>
        </div>
      </div>
    </div>
  );
}

export default AnalysisConfirmModal;