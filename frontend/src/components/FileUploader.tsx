import { useState, ChangeEvent, DragEvent } from 'react';
import { GoFileDirectoryFill } from "react-icons/go";
import { IoCloudUpload } from "react-icons/io5";
import './FileUploader.css';

interface FileUploaderProps {
  onFileSelect?: (file: File) => void;
  onUploadSuccess?: (result: { file: File; success: boolean }) => void;
  onUploadError?: (error: Error) => void;
}

function FileUploader({ onFileSelect, onUploadSuccess, onUploadError }: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (onFileSelect) onFileSelect(file);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      if (onFileSelect) onFileSelect(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      try {
        if (onUploadSuccess) {
          onUploadSuccess({ file: selectedFile, success: true });
        }
      } catch (error) {
        if (onUploadError && error instanceof Error) onUploadError(error);
      }
    }
  };

  const handleReselect = () => setSelectedFile(null);

  return (
    <div className="file-uploader-simple">
      {!selectedFile ? (
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
          <IoCloudUpload className="upload-icon-simple" />
          <button
            onClick={() => document.getElementById("file-input-simple")?.click()}
            type="button"
            className="select-button"
          >
            파일 선택
          </button>
          <p className="upload-description">
            파일을 드래그하거나 클릭하여 업로드하세요
          </p>
        </div>
      ) : (
        <div className="file-selected-area">
          <div className="file-info-simple">
            <div className="file-icon-large">
              <GoFileDirectoryFill size={35} />
            </div>
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