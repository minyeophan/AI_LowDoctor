import { FaMinus, FaPlus  } from "react-icons/fa";
import './DocumentMeta.css';

interface DocumentMetaProps {
  filename: string;
  uploadDate: string;
  zoomLevel: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

export function DocumentInfoBar({ uploadDate, filename }: { uploadDate: string; filename: string }) {
  return (
    <div className="meta-string-box">
      <span>{filename}</span>
      <span>업로드 일시: {new Date(uploadDate).toLocaleString('ko-KR')}</span>
    </div>
  );
}

function DocumentMeta({ 
  uploadDate, 
  filename,
  zoomLevel, 
  onZoomIn, 
  onZoomOut 
}: DocumentMetaProps) {
  return (
    
    <div className="document-meta">
      <div className="meta-box">
        <div className="zoom-box">
          <button onClick={onZoomOut} title="축소">
            <FaMinus color="#bdc2c7ff"/>
          </button>
          <span className="zoom-level">{zoomLevel}%</span>
          <button onClick={onZoomIn} title="확대">
            <FaPlus color="#bdc2c7ff"/>
          </button>
        </div>
      </div>
    </div>
  );
}

export default DocumentMeta;