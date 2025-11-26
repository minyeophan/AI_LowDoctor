import DocumentMeta from '../shared/DocumentMeta';
import { RiskItem } from '../../../services/api';
import { mockDocumentContent } from '../../../services/mockData';
import { useState } from 'react';
import "./DangerView.css"


interface DangerViewProps {
  currentDocument: {
    content: string;
    uploadDate: string;
    filename: string;
  };
  riskData: RiskItem[];
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

function DangerView({ 
  currentDocument,
  riskData,
  zoomLevel, 
  onZoomIn, 
  onZoomOut,
}: DangerViewProps) {
  
  const documentContent = currentDocument.content || mockDocumentContent;
  
  // 본문을 줄 단위로 분리
  const lines = documentContent.split('\n');
  const totalLength = documentContent.length;

  // 위험 포인트 위치 계산
  const riskPositions = riskData.map((risk: RiskItem, index: number) => {
    const position = documentContent.indexOf(risk.clauseText);
    const percentage = position >= 0 ? (position / totalLength) * 100 : (index / riskData.length) * 100;
    return {
      ...risk,
      position: percentage,
      index: index,
    };
  });
  
  // 점 클릭 시 해당 위치로 스크롤
  const handleDotClick = (index: number) => {
    const element = document.getElementById(`risk-${index}`);
    console.log('클릭:', index, element);

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // 하이라이트 효과
      element.classList.add('highlight-active');
      setTimeout(() => {
        element.classList.remove('highlight-active');
      }, 2000);
    }
  };

  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <div className="content-section">

      <div className="dangerous-box"> 
        <div className='danger-box-text'>
          
          <p>{riskData.length}개의 위험 포인트를 찾았어요</p>
        </div>

        <div className="risk-position-bar">
          {riskPositions.map((risk, index) => (
            <div
              key={index}
              className={`risk-dot severity-${risk.riskLevel}`}
              style={{ left: `${risk.position}%` }}
              title={risk.clauseText}
              onClick={() => handleDotClick(index)}
            />
          ))}
        </div>

        <button 
    className="guide-toggle-btn"
    onClick={() => setIsGuideOpen(!isGuideOpen)}
  >
    <span>{isGuideOpen ? '설명 숨기기' : '위험 포인트 설명 보기'}</span>
    <span className={`toggle-icon ${isGuideOpen ? 'open' : ''}`}>
      ▼
    </span>
  </button>

  {/* 토글 내용 */}
  {isGuideOpen && (
    <div className="risk-guide-content">
      <div className="risk-level-guide">
        <div className="guide-item high">
          <span className="guide-dot"></span>
          <div className="guide-text">
            <strong>높음 (High)</strong>
            <p>계약자에게 심각한 불이익을 줄 수 있는 조항입니다. 반드시 수정하거나 전문가 상담이 필요합니다.</p>
          </div>
        </div>

        <div className="guide-item medium">
          <span className="guide-dot"></span>
          <div className="guide-text">
            <strong>중간 (Medium)</strong>
            <p>주의가 필요한 조항입니다. 상황에 따라 불리할 수 있으니 신중히 검토하세요.</p>
          </div>
        </div>

        <div className="guide-item low">
          <span className="guide-dot"></span>
          <div className="guide-text">
            <strong>낮음 (Low)</strong>
            <p>경미한 주의사항입니다. 참고용으로 확인하시면 됩니다.</p>
          </div>
        </div>
      </div>

      <div className="guide-tips">
        <h4>위험도 보는 팁</h4>
        <ul>
          <li>위 막대의 점을 클릭하면 해당 위치로 이동합니다</li>
          <li>각 조항 아래에 위험 이유와 대응 방법이 표시됩니다</li>
          <li>의심스러운 조항은 전문가와 상담하는 것을 권장합니다</li>
        </ul>
      </div>
    </div>
  )}
      </div>

      {/* 본문 + 위험 조항 하이라이트 */}
      <div className="content-analysis-box"
        style={{
          fontSize: `${zoomLevel}%`,
          transformOrigin: 'top',
        }}>

        <DocumentMeta 
          filename={currentDocument.filename}
          uploadDate={currentDocument.uploadDate}
          zoomLevel={zoomLevel}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
        />

        <div className="document-with-danger">
          <div className="danger-header">
            <h2>위험 탐지</h2>
            <p className="danger-description">
              AI 분석 결과, 본 계약서에서 잠재적 법적 위험이 확인되었습니다. <br />
              표시된 조항을 검토하시고, 권고된 대응 가이드를 참고하여 수정 또는 재검토해 주세요.
            </p>
          </div>
          {lines.map((line, lineIndex) => {
            const trimmedLine = line.trim();
            
            if (trimmedLine.length < 10) {
              return (
                <p key={lineIndex} className="document-line">
                  {line || '\u00A0'}
                </p>
              );
            }
            
            // 위험 조항 찾기
            const matchedRiskIndex = riskData.findIndex((risk: RiskItem) => {
              const clauseText = risk.clauseText.trim();
              return trimmedLine.includes(clauseText) || clauseText.includes(trimmedLine);
            });
            
            const matchedRisk = matchedRiskIndex >= 0 ? riskData[matchedRiskIndex] : null;
            
            // 위험 조항이 아니면 일반 텍스트만 표시
            if (!matchedRisk) {
              return (
                <p key={lineIndex} className="document-line">
                  {line || '\u00A0'}
                </p>
              );
            }
            
            // 위험 조항이면 하이라이트 + 이유 박스 표시
            return (
              <div 
                key={lineIndex}
                id={`risk-${matchedRiskIndex}`}
                className={`danger-item severity-${matchedRisk.riskLevel}`}
              >
                <p className={`document-line highlight-${matchedRisk.riskLevel}`}>
                  {line}
                </p>
                <div className={`reason-box severity-${matchedRisk.riskLevel}`}>
                  <p className="reason">⚠️ {matchedRisk.reason}</p>
                  <p className="guide">[참고] {matchedRisk.guide}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DangerView;