import { GoPlus } from "react-icons/go";
import { AiOutlineMinus } from "react-icons/ai";
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
            <AiOutlineMinus color="#666"/>
          </button>
          <span className="zoom-level">{zoomLevel}%</span>
          <button onClick={onZoomIn} title="확대">
            <GoPlus color="#666"/>
          </button>
        </div>
      </div>
    </div>
  );
}

export default DocumentMeta;