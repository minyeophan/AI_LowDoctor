import './AnalysisLoadingOverlay.css';

interface AnalysisLoadingOverlayProps {
  type: 'summary' | 'danger' | 'guide';
}

function AnalysisLoadingOverlay({ type }: AnalysisLoadingOverlayProps) {
  const messages = {
    summary: 'AI가 문서를 요약하는 중입니다...',
    danger: '위험 요소를 분석하는 중입니다...',
    guide: '대응 가이드를 생성하는 중입니다...'
  };

  return (
    <div className="analysis-loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <p className="loading-message">{messages[type]}</p>
      </div>
    </div>
  );
}

export default AnalysisLoadingOverlay;