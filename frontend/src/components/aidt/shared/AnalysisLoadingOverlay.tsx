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
  const timers = [
    setTimeout(() => setCurrentStep(1), 5000),
    setTimeout(() => setCurrentStep(2), 10000),
  ];
  return () => timers.forEach(clearTimeout);
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