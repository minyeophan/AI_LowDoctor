import DocumentMeta from '../shared/DocumentMeta';
import { RiskItem } from '../../../services/api';
import { mockDocumentContent } from '../../../services/mockData';
import { useState, useMemo } from 'react';
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
  const lines = documentContent.split('\n');
  const totalLength = documentContent.length;

  // ✅ 1단계: 각 위험 항목이 처음 나타나는 줄 번호 찾기
  const riskFirstAppearance = useMemo(() => {
    const appearances = new Map<number, number>(); // riskIndex → lineIndex
    const matchedRisks = new Set<number>();

    lines.forEach((line, lineIndex) => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.length < 10) return;
      
      const matchedRiskIndex = riskData.findIndex((risk: RiskItem) => {
        // 이미 매칭된 위험은 스킵
        if (matchedRisks.has(riskData.indexOf(risk))) return false;

        if (risk.searchKeyword) {
          const keyword = risk.searchKeyword.trim();
          if (trimmedLine.includes(keyword)) {
            return true;
          }
        }
        
        const clauseText = risk.clauseText.trim();
        
        if (trimmedLine.includes(clauseText)) {
          return true;
        }
        
        if (clauseText.includes(trimmedLine) && trimmedLine.length > 10) {
          return true;
        }
        
        const keywords = clauseText.split(' ').filter(w => w.length > 3);
        return keywords.some(keyword => trimmedLine.includes(keyword));
      });

      if (matchedRiskIndex >= 0 && !matchedRisks.has(matchedRiskIndex)) {
        appearances.set(matchedRiskIndex, lineIndex);
        matchedRisks.add(matchedRiskIndex);
      }
    });

    return appearances;
  }, [lines, riskData]);

  // ✅ 2단계: 위험 포인트 위치 계산 (실제 줄 번호 기반)
  const riskPositions = useMemo(() => {
    return riskData.map((risk: RiskItem, index: number) => {
      const lineIndex = riskFirstAppearance.get(index);
      
      if (lineIndex !== undefined) {
        // 실제 문서에서 찾은 경우: 줄 번호 기반 위치
        const percentage = (lineIndex / lines.length) * 100;
        console.log(`✅ [${index + 1}] 줄 ${lineIndex}에서 발견 → ${percentage.toFixed(1)}%`);
        
        return {
          ...risk,
          position: percentage,
          index: index,
        };
      }

      // 못 찾은 경우: 문자열 검색으로 fallback
      let position = -1;
      
      if (risk.searchKeyword) {
        position = documentContent.indexOf(risk.searchKeyword);
      }
      
      if (position < 0) {
        position = documentContent.indexOf(risk.clauseText);
      }
      
      if (position < 0) {
        const keywords = risk.clauseText.split(' ').filter(w => w.length > 3);
        for (const keyword of keywords.slice(0, 3)) {
          position = documentContent.indexOf(keyword);
          if (position >= 0) break;
        }
      }
      
      const percentage = position >= 0 
        ? (position / totalLength) * 100 
        : (index / riskData.length) * 100;
      
      console.warn(`⚠️ [${index + 1}] "${risk.clauseText}" 문서에서 못 찾음! 위치: ${percentage.toFixed(1)}%`);
      
      return {
        ...risk,
        position: percentage,
        index: index,
      };
    });
  }, [riskData, riskFirstAppearance, documentContent, lines.length, totalLength]);
  
  // 점 클릭 시 해당 위치로 스크롤
  const handleDotClick = (riskIndex: number) => {
    const element = document.getElementById(`risk-${riskIndex}`);
    console.log('클릭:', riskIndex, element);

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

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
          {(() => {
            const matchedRiskIndices = new Set<number>();

            return lines.map((line, lineIndex) => {
              const trimmedLine = line.trim();
              
              if (trimmedLine.length < 10) {
                return (
                  <p key={lineIndex} className="document-line">
                    {line || '\u00A0'}
                  </p>
                );
              }
              
              const matchedRiskIndex = riskData.findIndex((risk: RiskItem) => {
                if (risk.searchKeyword) {
                  const keyword = risk.searchKeyword.trim();
                  if (trimmedLine.includes(keyword)) {
                    return true;
                  }
                }
                
                const clauseText = risk.clauseText.trim();
                
                if (trimmedLine.includes(clauseText)) {
                  return true;
                }
                
                if (clauseText.includes(trimmedLine) && trimmedLine.length > 10) {
                  return true;
                }
                
                const keywords = clauseText.split(' ').filter(w => w.length > 3);
                return keywords.some(keyword => trimmedLine.includes(keyword));
              });
              
              if (matchedRiskIndex >= 0 && matchedRiskIndices.has(matchedRiskIndex)) {
                return (
                  <p key={lineIndex} className="document-line">
                    {line || '\u00A0'}
                  </p>
                );
              }

              const matchedRisk = matchedRiskIndex >= 0 ? riskData[matchedRiskIndex] : null;
              
              if (!matchedRisk) {
                return (
                  <p key={lineIndex} className="document-line">
                    {line || '\u00A0'}
                  </p>
                );
              }
              
              matchedRiskIndices.add(matchedRiskIndex);
              
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
            });
          })()}
        </div>
      </div>
    </div>
  );
}

export default DangerView;