import DocumentMeta from '../shared/DocumentMeta';
import { useState } from 'react';
import { ContractTip, ImprovementGuide as APIImprovementGuide } from '../../../services/api';
import { mockImprovementGuides } from '../../../services/mockData';
import { MdWarning, MdCheckCircle, MdClose } from "react-icons/md";
import { FaHandPointRight } from "react-icons/fa";
import { MdDocumentScanner } from "react-icons/md";
import { IoMdDownload } from "react-icons/io";

import '../views/GuideView.css';

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
}

interface ImprovementGuide {
  id: number;
  page?: number;
  originalClause: string;
  checkPoints: string[];
  improvedClause: string;
}

function GuideView({ 
  currentDocument,
  contractTip,
  improvementGuides = mockImprovementGuides,
  zoomLevel, 
  onZoomIn, 
  onZoomOut 
}: GuideViewProps) {
  
  const [isTipOpen, setIsTipOpen] = useState(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [improvedDocument, setImprovedDocument] = useState('');

  // 개선된 문서 생성
  const generateImprovedDocument = () => {
    let modifiedContent = currentDocument.content;
    
    improvementGuides.forEach(guide => {
      modifiedContent = modifiedContent.replace(
        guide.originalClause,
        guide.improvedClause
      );
    });
    
    return modifiedContent;
  };

  // 대응 가이드 적용하기 클릭
  const handleApplyGuide = () => {
    const improved = generateImprovedDocument();
    setImprovedDocument(improved);
    setShowPreviewModal(true);
  };

  // 저장하기
  const handleSave = () => {
    const blob = new Blob([improvedDocument], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const originalName = currentDocument.filename.replace(/\.[^/.]+$/, '');
    a.download = `${originalName}_개선본.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    // 성공 메시지 표시 (선택사항)
    alert('개선된 문서가 저장되었습니다!');
    setShowPreviewModal(false);
  };

  return (
    <div className="content-section">
      {/* 팁 박스 */}
      <div className={`guide-tip-box ${isTipOpen ? 'open' : ''}`}>
        <button 
          className="tip-header"
          onClick={() => setIsTipOpen(!isTipOpen)}
        >
          <div className="tip-title-group">
            <h3 className="tip-title">TIP</h3>
            <span className="tip-badge">{contractTip.docType}</span>
          </div>
          <span className={`tip-toggle-icon ${isTipOpen ? 'open' : ''}`}>
            ▼
          </span>
        </button>
        
        <div className="tip-content">
          <p className="tip-main-title">[{contractTip.docType}] 작성 시 알아두세요</p>
          <ul>
            {contractTip.items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* 스크롤 영역 */}
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
        <div className='guide-body'>
          <div className="guide-header">
            <h2>대응 가이드</h2>
            <p className="guide-description">
              계약서에서 개선이 필요한 조항을 확인하고 수정 방법을 참고하세요.
            </p>
          </div>

          {/* 개선 가이드 목록 */}
          <div className="improvement-list">
            {improvementGuides.map((guide) => (
              <div key={guide.id} className="improvement-item">
                {guide.page && (
                  <div className="clause-page">
                    <span className="page-badge">문서 {guide.page}p</span>
                  </div>
                )}

                <div className="original-clause-section">
                  <div className="section-header">
                    <MdWarning className="warning-icon" />
                    <h3>개선이 필요한 조항</h3>
                  </div>
                  <div className="clause-box original">
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
                  <div className="clause-box improved">
                    <p>{guide.improvedClause}</p>
                  </div>
                </div>
              </div>
            ))}
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
        <div className="preview-modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-modal-header">
              <div className="modal-title-group">
                <h2>개선된 문서 미리보기</h2>
                <span className="modal-subtitle">
                  {improvementGuides.length}개의 조항이 개선되었습니다
                </span>
              </div>
              <button 
                className="modal-close-btn"
                onClick={() => setShowPreviewModal(false)}
              >
                <MdClose size={24} />
              </button>
            </div>

            <div className="preview-modal-body">
              <div className="preview-content">
                <pre>{improvedDocument}</pre>
              </div>
            </div>

            <div className="preview-modal-footer">
              <button 
                className="modal-cancel-btn"
                onClick={() => setShowPreviewModal(false)}
              >
                취소
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