import './AnalysisLoadingOverlay.css';
import LoadingCharacter from '../shared/Loadingcharacter';
import { useState, useEffect } from 'react';

function AnalysisLoadingOverlay() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    '핵심 요약 중입니다...',
    '위험 탐지 중입니다...',
    '대응 가이드를 생성하고 있습니다...',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="analysis-loading-overlay">
      <div className="loading-content">
        <LoadingCharacter />
        <p className="loading-message">{steps[currentStep]}</p>
      </div>
    </div>
  );
}

export default AnalysisLoadingOverlay;