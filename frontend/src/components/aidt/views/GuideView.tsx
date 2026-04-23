import DocumentMeta from '../shared/DocumentMeta';
import { useState } from 'react';
import { ContractTip, ImprovementGuide as APIImprovementGuide } from '../../../api/analyze';
import { mockImprovementGuides } from '../../../mock/mockData';
import { MdWarning, MdCheckCircle, MdClose } from "react-icons/md";
import { FaHandPointRight } from "react-icons/fa";
import { MdDocumentScanner } from "react-icons/md";
import { IoMdDownload } from "react-icons/io";
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

import '../views/GuideView.css';

const DEFAULT_CONTRACT_TIP = {
  docType: '부동산',
  title: '부동산 계약 시 알아두세요',
  items: [
    '계약 전·후 등기부등본을 반드시 확인하고, 근저당·가압류 등 권리관계를 꼼꼼히 살피세요.',
    '전입신고와 확정일자는 잔금 지급 당일 즉시 받아야 보증금을 법적으로 보호받을 수 있습니다.',
    '보증금이 클수록 전세보증보험(HUG·SGI) 가입을 적극 검토하고, 가입 가능 여부를 사전에 확인하세요.',
    '특약사항은 구두 약속이 아닌 계약서에 직접 명시해야 법적 효력이 발생합니다.',
  ]
};

interface GuideViewProps {
  currentDocument: {
    content: string;
    uploadDate: string;
    filename: string;
  };
  contractTip: ContractTip;
  improvementGuides?: ImprovementGuide[]; 
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  editedHtml?: string;
}

interface ImprovementGuide {
  id: number;
  page?: number;
  originalClause: string;
  checkPoints: string[];
  improvedClause: string;
  riskLevel?: 'low' | 'medium' | 'high';
}

function GuideView({ 
  currentDocument,
  contractTip,
  improvementGuides = mockImprovementGuides,
  zoomLevel, 
  onZoomIn, 
  onZoomOut,
  editedHtml = '',
}: GuideViewProps) {
  
  const [isTipOpen, setIsTipOpen] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const displayTip = (contractTip && contractTip.items?.length > 0)
    ? contractTip
    : DEFAULT_CONTRACT_TIP;
  const [improvedDocument, setImprovedDocument] = useState('');

  // 개선된 문서 생성
  const generateImprovedDocument = () => {
  // editedHtml 기반으로 교체 (서식 유지)
  let modifiedHtml = editedHtml || `<p>${currentDocument.content}</p>`;

  improvementGuides.forEach(guide => {
    const trimmed = guide.originalClause.trim();
if (!trimmed) return;

// 앞 공백/특수문자 제거
const cleanTrimmed = trimmed.replace(/^[\s\-\•\*]+/, '').trim();

// 1순위: 완전 매칭
if (modifiedHtml.includes(cleanTrimmed)) {
  modifiedHtml = modifiedHtml.replace(cleanTrimmed, guide.improvedClause);
  return;
}

// 2순위: 첫 문장 매칭
const firstSentence = cleanTrimmed.split(/[,.。]/)[0].trim();
if (firstSentence.length > 5 && modifiedHtml.includes(firstSentence)) {
  modifiedHtml = modifiedHtml.replace(firstSentence, guide.improvedClause);
  return;
}

// 3순위: 긴 단어 매칭
const words = cleanTrimmed.split(' ').filter(w => w.length > 4).sort((a, b) => b.length - a.length);
for (const word of words.slice(0, 3)) {
  if (modifiedHtml.includes(word)) {
    modifiedHtml = modifiedHtml.replace(word, guide.improvedClause);
    break;
  }
}
  });

  return modifiedHtml;
};

  // 대응 가이드 적용하기 클릭
  const handleApplyGuide = () => {
    const improved = generateImprovedDocument();
    setImprovedDocument(improved);
    setShowPreviewModal(true);
  };

  const handleSave = () => {
  const printWindow = window.open('', '', 'height=800,width=800');
  if (!printWindow) return;
  printWindow.document.write(`
    <html>
      <head>
        <meta charset="utf-8">
        <title>개선된 계약서</title>
        <style>
          body { 
            font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif; 
            padding: 40px 60px;
            line-height: 1.8;
            font-size: 13px;
            color: #1a1a1a;
          }
          table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 12px 0;
          }
          td, th { 
            border: 1px solid #ccc; 
            padding: 6px 10px;
            vertical-align: top;
          }
          th { background: #f5f5f5; font-weight: 600; }
          p { margin: 4px 0; }
        </style>
      </head>
      <body>${improvedDocument}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
};

  return (
    <div className="content-section">
      {/* 팁 박스 */}
      <div className="guide-tip-box-wrapper">
      <div className={`guide-tip-box ${isTipOpen ? 'open' : ''}`}>
        <button 
          className="tip-header"
          onClick={() => setIsTipOpen(!isTipOpen)}
        >
          <div className="tip-title-group">
            <h3 className="tip-title">TIP</h3>
            <span className="tip-badge">{displayTip.docType}</span>
          </div>
          <span className={`tip-toggle-icon ${isTipOpen ? 'open' : ''}`}>
            ▼
          </span>
        </button>
        
        <div className="tip-content">
          <p className="tip-main-title">[{displayTip.docType}] 작성 시 알아두세요</p>
          <ul>
            {displayTip.items.slice(0, 4).map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
</div>
      {/* 스크롤 영역 */}
      <div className="content-analysis-box has-header"
        style={{
          fontSize: `${zoomLevel / 100}em`,
          transformOrigin: 'top',
        }}>
        <DocumentMeta 
          filename={currentDocument.filename}
          uploadDate={currentDocument.uploadDate}
          zoomLevel={zoomLevel}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
        />
        <div className='guide-body'>
          <div className="guide-header">
            <h2>대응 가이드</h2>
            <p className="guide-description">
              계약서에서 개선이 필요한 조항을 확인하고 수정 방법을 참고하세요.
            </p>
          </div>

          {/* 개선 가이드 목록 */}
          <div className="improvement-list">
            {improvementGuides.map((guide) => {
              const level = (guide.riskLevel || 'low').toLowerCase() as 'high' | 'medium' | 'low';
              const levelLabel = level === 'high' ? '높음' : level === 'medium' ? '중간' : '낮음';
              return (
              <div key={guide.id} className={`improvement-item severity-${level}`}>
                <div className="improvement-item-header">
                  {guide.page && (
                    <span className="page-badge">문서 {guide.page}p</span>
                  )}
                </div>
                <div className="original-clause-section">
                  <div className="section-header">
                    <MdWarning className="warning-icon" />
                    <h3>개선이 필요한 조항</h3>
                  </div>
                 <div className={`clause-box original severity-${level}`}>
                  <p>{guide.originalClause}</p>
                </div>
                </div>

                <div className="check-points">
                  <p className="check-title">
                    <MdCheckCircle/> Check Point
                  </p>
                  {guide.checkPoints.map((point, index) => (
                    <p key={index} className="check-point-item">
                      • {point}
                    </p>
                  ))}
                </div>

                <div className="improved-clause-section">
                  <div className="section-header">
                    <FaHandPointRight className='retouch-icon'/>
                    <h3>이렇게 수정해보세요</h3>
                  </div>
                  <div className="emend-box improved">
                    <p>{guide.improvedClause}</p>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      </div>

      {/* 대응 가이드 적용하기 버튼 */}
      <button className="apply-guide-btn" onClick={handleApplyGuide}>
        <MdDocumentScanner />
        대응 가이드 적용하기
      </button>

      {/* 미리보기 모달 */}
      {showPreviewModal && (
        <div className="preview-modal-overlay">
          <div className="preview-modal">
            <div className="preview-modal-header">
              <div className="modal-title-group">
                <h2>개선된 문서 미리보기</h2>
                <span className="modal-subtitle">
                  {improvementGuides.length}개의 조항이 개선되었습니다
                </span>
              </div>
            </div>

            {/* 문서 느낌 미리보기 */}
            <div className="preview-modal-body">
              <div className="preview-document-wrapper">
                <div className="preview-document-page">
                  <div className="preview-document-content">
                    <div
                        className="preview-doc-html"
                        dangerouslySetInnerHTML={{ __html: improvedDocument }}
                      />
                  </div>
                </div>
              </div>
            </div>

            <div className="preview-modal-footer">
              <button 
                className="modal-cancel-btn"
                onClick={() => setShowPreviewModal(false)}
              >
                닫기
              </button>
              <button 
                className="modal-save-btn"
                onClick={handleSave}
              >
                <IoMdDownload className="btn-icon" />
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GuideView;