import './LoadingOverlay.css';
import LoadingCharacter from '../shared/Loadingcharacter';

interface LoadingOverlayProps {
  message?: string;
}

function LoadingOverlay({ message = '계약서를 업로드하는 중입니다...' }: LoadingOverlayProps) {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <LoadingCharacter />
        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
}

export default LoadingOverlay;