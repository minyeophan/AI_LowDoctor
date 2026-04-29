import DocumentMeta from '../shared/DocumentMeta';
import { RiskItem } from '../../../api/analyze';
import { mockDocumentContent } from '../../../mock/mockData';
import { useState, useMemo } from 'react';
import { MdError } from "react-icons/md";
import "./DangerView.css"

const normalizeRiskLevel = (level?: string): 'high' | 'medium' | 'low' => {
  const normalized = (level || '').toLowerCase();
  if (normalized === 'critical' || normalized === 'high') return 'high';
  if (normalized === 'medium') return 'medium';
  return 'low';
};

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
  editedHtml?: string;
}

function DangerView({ 
  currentDocument,
  riskData,
  zoomLevel, 
  onZoomIn, 
  onZoomOut,
  editedHtml = '',
}: DangerViewProps) {

  const blocks = useMemo(() => {
    const result: { type: 'table' | 'text'; content: string }[] = [];
    const html = editedHtml || '';

    if (!html) {
      const content = currentDocument.content || mockDocumentContent;
      content.split('\n').forEach(line => result.push({ type: 'text', content: line }));
      return result;
    }

    const tableRegex = /<table[\s\S]*?<\/table>/gi;
    let lastIndex = 0;
    let match;

    while ((match = tableRegex.exec(html)) !== null) {
      if (match.index > lastIndex) {
        const div = document.createElement('div');
        div.innerHTML = html.slice(lastIndex, match.index);
        const text = div.innerText || div.textContent || '';
        text.split('\n').forEach(line => result.push({ type: 'text', content: line }));
      }

      const tableDiv = document.createElement('div');
      tableDiv.innerHTML = match[0];
      const tdCount = tableDiv.querySelectorAll('td').length;

      if (tdCount <= 1) {
        const tdEl = tableDiv.querySelector('td');
        if (tdEl) {
          tdEl.querySelectorAll('p, br').forEach(el => {
            if (el.tagName === 'BR') {
              el.replaceWith('\n');
            } else {
              el.insertAdjacentText('afterend', '\n');
            }
          });
          const text = (tdEl.innerText || tdEl.textContent || '').trim();
          text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .forEach(line => result.push({ type: 'text', content: line }));
        }
      } else {
        result.push({ type: 'table', content: match[0] });
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < html.length) {
      const div = document.createElement('div');
      div.innerHTML = html.slice(lastIndex);
      const text = div.innerText || div.textContent || '';
      text.split('\n').forEach(line => result.push({ type: 'text', content: line }));
    }

    return result;
  }, [editedHtml, currentDocument.content]);

  const riskFirstAppearance = useMemo(() => {
    const appearances = new Map<number, number>();

    riskData.forEach((risk: RiskItem, riskIdx: number) => {
      const getMatchScore = (text: string, risk: RiskItem): number => {
        const t = text.trim();
        if (t.length < 5) return 0;
        const clauseText = risk.clauseText?.trim() ?? '';
        if (!clauseText) return 0;
        if (t.includes(clauseText)) return 90;
        const firstSentence = clauseText.split(/[,.。]/)[0].trim();
        if (firstSentence.length > 5 && t.includes(firstSentence)) return 70;
        if (clauseText.includes(t) && t.length > 10) return 50;
        const words = clauseText.split(' ').filter(w => w.length > 3);
        if (words.length === 0) return 0;
        const matchCount = words.filter(w => t.includes(w)).length;
        const ratio = matchCount / words.length;
        return ratio >= 0.5 ? ratio * 40 : 0;
      };

      let bestScore = 0;
      let bestBlockIndex = -1;

      blocks.forEach((block, blockIndex) => {
        const text = block.type === 'table'
          ? (() => {
              const d = document.createElement('div');
              d.innerHTML = block.content;
              return (d.innerText || d.textContent || '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
            })()
          : block.content;

        const score = getMatchScore(text, risk);
        if (score > bestScore) {
          bestScore = score;
          bestBlockIndex = blockIndex;
        }
      });

      if (bestBlockIndex >= 0 && bestScore >= 30) {
        appearances.set(riskIdx, bestBlockIndex);
      }
    });

    return appearances;
  }, [blocks, riskData]);

  const riskPositions = useMemo(() => {
    return riskData.map((risk: RiskItem, index: number) => {
      const blockIndex = riskFirstAppearance.get(index);
      if (blockIndex !== undefined) {
        return {
          ...risk,
          position: Math.min((blockIndex / blocks.length) * 100, 97),
          index,
        };
      }
      return {
        ...risk,
        position: (index / riskData.length) * 100,
        index,
      };
    });
  }, [riskData, riskFirstAppearance, blocks.length]);

  const adjustedPositions = useMemo(() => {
    const MIN_GAP = 3;
    const sorted = [...riskPositions].sort((a, b) => a.position - b.position);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].position - sorted[i - 1].position < MIN_GAP) {
        sorted[i] = { ...sorted[i], position: sorted[i - 1].position + MIN_GAP };
      }
    }
    return riskPositions.map(r => sorted.find(s => s.index === r.index) || r);
  }, [riskPositions]);

  const handleDotClick = (riskIndex: number) => {
    const reasonElement = document.getElementById(`reason-box-${riskIndex}`);
    const riskElement = document.getElementById(`risk-${riskIndex}`);
    const target = reasonElement || riskElement;
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('highlight-active');
    setTimeout(() => target.classList.remove('highlight-active'), 2000);
  };

  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <div className="content-section">
      <div className="dangerous-box">
        <div className='danger-box-text'>
          <div className="info-icon-wrapper">
            <span className="info-icon">
              <MdError 
                onMouseEnter={() => setIsGuideOpen(true)}
                onMouseLeave={() => setIsGuideOpen(false)}
              />
            </span>
            <p>{riskData.length}개의 위험 포인트를 찾았어요</p>
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
        </div>

        <div className="risk-position-bar">
          {adjustedPositions.map((risk, index) => (
            <div
              key={index}
              className={`risk-dot severity-${normalizeRiskLevel(risk.riskLevel)}`}
              style={{ left: `${risk.position}%` }}
              onClick={() => handleDotClick(index)}
            />
          ))}
        </div>
      </div>

      <div
        className="content-analysis-box has-header"
        style={{
          fontSize: `${zoomLevel / 100}em`,
          transformOrigin: 'top',
        }}
      >
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
              AI 분석 결과 본 계약서에서 잠재적 법적 위험이 확인되었습니다. <br />
              표시된 조항을 검토하시고 권고된 대응 가이드를 참고하여 수정 또는 재검토하세요.
            </p>
          </div>

          {(() => {
            const matchedRiskIndices = new Set<number>();

            return blocks.map((block, blockIndex) => {
              if (block.type === 'table') {
                const matchedRiskIndicesForBlock: number[] = [];
                riskFirstAppearance.forEach((appearBlockIndex, riskIdx) => {
                  if (appearBlockIndex === blockIndex && !matchedRiskIndices.has(riskIdx)) {
                    matchedRiskIndicesForBlock.push(riskIdx);
                  }
                });

                if (matchedRiskIndicesForBlock.length > 0) {
                  const highestLevel = matchedRiskIndicesForBlock.reduce((highest, riskIdx) => {
                    const level = normalizeRiskLevel(riskData[riskIdx].riskLevel);
                    if (level === 'high') return 'high';
                    if (level === 'medium' && highest !== 'high') return 'medium';
                    return highest;
                  }, 'low' as 'high' | 'medium' | 'low');

                  matchedRiskIndicesForBlock.forEach(idx => matchedRiskIndices.add(idx));

                  return (
                    <div key={blockIndex} id={`risk-${matchedRiskIndicesForBlock[0]}`} className={`danger-item severity-${highestLevel}`}>
                      <div className={`danger-table-block table-border-${highestLevel}`} dangerouslySetInnerHTML={{ __html: block.content }} />
                      {matchedRiskIndicesForBlock.map(riskIdx => {
                        const risk = riskData[riskIdx];
                        const level = normalizeRiskLevel(risk.riskLevel);
                        return (
                          <div key={riskIdx}>
                            <div className={`clause-table-box severity-${level}`}>
                              <p className="clause-text">{risk.clauseText}</p>
                            </div>
                            <div id={`reason-box-${riskIdx}`} className={`reason-box severity-${level}`}>
                              <p className="reason">⚠️ {risk.reason || risk.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                return (
                  <div key={blockIndex} className="danger-table-block" dangerouslySetInnerHTML={{ __html: block.content }} />
                );
              }

              const line = block.content;
              const trimmedLine = line.trim();

              if (trimmedLine.length < 10) {
                return <p key={blockIndex} className="document-line">{line || '\u00A0'}</p>;
              }

              const matchedRiskIndicesForBlock: number[] = [];
              riskFirstAppearance.forEach((appearBlockIndex, riskIdx) => {
                if (appearBlockIndex === blockIndex && !matchedRiskIndices.has(riskIdx)) {
                  matchedRiskIndicesForBlock.push(riskIdx);
                }
              });

              if (matchedRiskIndicesForBlock.length === 0) {
                return <p key={blockIndex} className="document-line">{line || '\u00A0'}</p>;
              }

              const highestLevel = matchedRiskIndicesForBlock.reduce((highest, riskIdx) => {
                const level = normalizeRiskLevel(riskData[riskIdx].riskLevel);
                if (level === 'high') return 'high';
                if (level === 'medium' && highest !== 'high') return 'medium';
                return highest;
              }, 'low' as 'high' | 'medium' | 'low');

              matchedRiskIndicesForBlock.forEach(idx => matchedRiskIndices.add(idx));

              return (
                <div key={blockIndex} id={`risk-${matchedRiskIndicesForBlock[0]}`} className={`danger-item severity-${highestLevel}`}>
                  <p className={`document-line highlight-${highestLevel}`}>
                    {line}
                  </p>
                  {matchedRiskIndicesForBlock.map(riskIdx => {
                    const risk = riskData[riskIdx];
                    const level = normalizeRiskLevel(risk.riskLevel);
                    return (
                      <div id={`reason-box-${riskIdx}`} key={riskIdx} className={`reason-box severity-${level}`}>
                        <p className="reason">⚠️ {risk.reason || risk.description}</p>
                      </div>
                    );
                  })}
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