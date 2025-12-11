import DocumentMeta from '../shared/DocumentMeta';
import { SummaryItem } from '../../../services/api';
import '../views/SummaryView.css';

interface SummaryViewProps {
  currentDocument: {
    content: string;
    uploadDate: string;
    filename: string;
  };
  summaryData: SummaryItem[];
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

function SummaryView({ 
  currentDocument,
  summaryData,
  zoomLevel, 
  onZoomIn, 
  onZoomOut,
}: SummaryViewProps) {
  
  return (
    <div className="content-section">
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
        <div className='summary-body'>
          <div className="summary-text-header">
            <div className='summary-header-content'>
              <h2>핵심 요약</h2>
              <p className="summary-description">
                문서의 핵심 요약된 내용을 확인해 보세요
              </p>
            </div>
          </div>
          {(Array.isArray(summaryData) ? summaryData : []).map((item, index) => (
            <div key={index} className="summary-item" style={{ fontSize: `${zoomLevel}%` }}>
              <h2 className="summary-highlight">{index + 1}. {item.title}</h2>
              <p className="summary-content-text">•{item.content}</p>
              {index < summaryData.length - 1 && <hr className="summary-divider" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SummaryView;