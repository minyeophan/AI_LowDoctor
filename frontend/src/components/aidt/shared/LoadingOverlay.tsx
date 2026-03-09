import './LoadingOverlay.css';
import LoadingCharacter from '../shared/Loadingcharacter';
interface LoadingOverlayProps {
  message?: string;
}

function LoadingOverlay({ message = '문서를 불러오는 중...' }: LoadingOverlayProps) {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
         <LoadingCharacter />
      </div>
    </div>
  );
}

export default LoadingOverlay;