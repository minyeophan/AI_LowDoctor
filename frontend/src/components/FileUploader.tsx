import { useState, ChangeEvent, DragEvent } from 'react';
import './FileUploader.css';

interface FileUploaderProps {
  onFileSelect?: (file: File) => void;
  onUploadSuccess?: (result: { file: File; success: boolean }) => void;
  onUploadError?: (error: Error) => void;
}

function FileUploader({ onFileSelect, onUploadSuccess, onUploadError }: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // 파일 선택 핸들러
  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      console.log('선택된 파일:', file.name);
      if (onFileSelect) {
        onFileSelect(file);
      }
    }
  };

  // 드래그 오버 핸들러
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  // 드래그 떠남 핸들러
  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // 드롭 핸들러
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      console.log('드롭된 파일:', file.name);
      if (onFileSelect) {
        onFileSelect(file);
      }
    }
  };

  // ✅ 업로드 버튼 클릭 - onUploadSuccess 호출!
  const handleUpload = () => {
    if (selectedFile) {
      try {
        console.log('📤 업로드 시작:', selectedFile.name);
        
        // ✅ onUploadSuccess 콜백 호출!
        if (onUploadSuccess) {
          onUploadSuccess({
            file: selectedFile,
            success: true,
          });
        }
        
        // 파일 선택 초기화 (선택적)
        // setSelectedFile(null);
      } catch (error) {
        console.error('❌ 업로드 오류:', error);
        if (onUploadError && error instanceof Error) {
          onUploadError(error);
        }
      }
    }
  };

  // 파일 재선택
  const handleReselect = () => {
    setSelectedFile(null);
  };

  return (
    <div className="file-uploader-simple">
      {!selectedFile ? (
        // 파일 선택 전 화면
        <div
          className={`upload-area ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-input-simple"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt,.hwp"
            style={{ display: 'none' }}
          />
          <div className="upload-icon-simple">
            ⬆︎
          </div>
          <button 
            onClick={() => document.getElementById("file-input-simple")?.click()} 
            type="button" 
            className="select-button"
          >
            파일 선택
          </button>  
          <p className="upload-description">
            첨부할 계약서를 여기에 끌어다 놓거나 계약서 선택 버튼을 눌러 첨부해 주세요.
          </p>
        </div>
      ) : (
        // 파일 선택 후 화면
        <div className="file-selected-area">
          <div className="file-info-simple">
            <div className="file-icon-large">📁</div>
            <p className="file-name-simple">{selectedFile.name}</p>
            <p className="file-size-simple">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
          
          <div className="action-buttons">
            <button className="reselect-button" onClick={handleReselect}>
              다시 선택
            </button>
            <button className="upload-button-simple" onClick={handleUpload}>
              업로드
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUploader;