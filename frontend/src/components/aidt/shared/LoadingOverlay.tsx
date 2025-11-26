import './LoadingOverlay.css';

interface LoadingOverlayProps {
  message?: string;
}

function LoadingOverlay({ message = '문서를 불러오는 중...' }: LoadingOverlayProps) {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
}

export default LoadingOverlay;