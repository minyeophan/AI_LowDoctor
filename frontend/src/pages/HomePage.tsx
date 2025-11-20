import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FileUploader from '../components/FileUploader';
import { useDocument } from '../context/DocumentContext';
import { UploadResult } from '../types';
import { api, ApiError } from '../services/api';
import { CiSquarePlus } from "react-icons/ci";
import { CiSaveDown2 } from "react-icons/ci";
import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();
  const { setCurrentDocument } = useDocument();
  const [isUploading, setIsUploading] = useState(false);

  // 백엔드 API 사용 여부 확인
  const API_ENABLED = import.meta.env.VITE_API_BASE_URL !== undefined && 
                      import.meta.env.VITE_API_BASE_URL !== '';

  const handleFileUpload = async (uploadResult: UploadResult) => {
    console.log('📤 파일 업로드 시작:', uploadResult.file.name);
    console.log('🔧 API 모드:', API_ENABLED ? '백엔드 연동' : '로컬 처리');

    // 백엔드 API가 활성화된 경우
    if (API_ENABLED) {
      setIsUploading(true);

      try {
        console.log('🌐 백엔드로 파일 전송 중...');
        
        // 백엔드로 파일 업로드
        const response = await api.uploadDocument(uploadResult.file);
        console.log('✔️백엔드 응답:', response);

        // Context에 문서 저장
        const newDoc = {
          documentId: response.documentId,
          filename: response.filename,
          size: response.size,
          uploadDate: response.uploadDate,
          content: response.extractedText, // 백엔드가 추출한 텍스트
          file: uploadResult.file,
        };

        setCurrentDocument(newDoc);
        navigate('/analysis');

      } catch (error) {
        console.error('❌ 백엔드 업로드 실패:', error);
        
        if (error instanceof ApiError) {
          alert(`업로드 실패: ${error.message} (코드: ${error.code})`);
        } else {
          alert('파일 업로드 중 오류가 발생했습니다.');
        }
      } finally {
        setIsUploading(false);
      }
      
      return;
    }

    // 백엔드 API가 비활성화된 경우 (기존 로컬 처리)
    console.log('💾 로컬에서 파일 처리 중...');
    
    try {
      const file = uploadResult.file;
      
      // 파일 타입에 따라 처리
      if (file.type === 'application/pdf') {
        // PDF 파일인 경우
        const content = `📄 PDF 파일: ${file.name}\n\n` +
                        `파일 크기: ${(file.size / 1024).toFixed(2)} KB\n` +
                        `업로드 시간: ${new Date().toLocaleString('ko-KR')}\n\n` +
                        `⚠️ PDF 내용을 보려면 백엔드 연결이 필요합니다.\n` +
                        `.env 파일에서 VITE_API_BASE_URL을 설정해주세요.`;
        
        const newDoc = {
          documentId: `doc_${Date.now()}`,
          filename: file.name,
          size: file.size,
          uploadDate: new Date().toISOString(),
          content: content,
          file: file,
        };

        setCurrentDocument(newDoc);
        navigate('/analysis');
        
      } else if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
        // 텍스트 파일인 경우
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const content = e.target?.result as string;
          
          const newDoc = {
            documentId: `doc_${Date.now()}`,
            filename: file.name,
            size: file.size,
            uploadDate: new Date().toISOString(),
            content: content || '(파일 내용이 비어있습니다)',
            file: file,
          };

          console.log('✅ 로컬 파일 처리 완료');
          setCurrentDocument(newDoc);
          navigate('/analysis');
        };

        reader.onerror = () => {
          console.error('❌ 파일 읽기 실패');
          alert('파일을 읽는 중 오류가 발생했습니다.');
        };

        reader.readAsText(file, 'UTF-8');
        
      } else {
        // 기타 파일
        const content = `📎 파일: ${file.name}\n\n` +
                        `파일 타입: ${file.type}\n` +
                        `파일 크기: ${(file.size / 1024).toFixed(2)} KB\n` +
                        `업로드 시간: ${new Date().toLocaleString('ko-KR')}\n\n` +
                        `이 파일 타입은 미리보기가 지원되지 않습니다.`;
        
        const newDoc = {
          documentId: `doc_${Date.now()}`,
          filename: file.name,
          size: file.size,
          uploadDate: new Date().toISOString(),
          content: content,
          file: file,
        };

        setCurrentDocument(newDoc);
        navigate('/analysis');
      }
      
    } catch (error) {
      console.error('❌ 파일 처리 오류:', error);
      alert('파일 처리 중 오류가 발생했습니다.');
    }
  };
  return (
    <div className="home-page">
      {/* 파일 업로드 섹션 */}
      <section className="upload-section">
        <div className='upload-section-box'>
        <h2 className="file-title">AIDT</h2>
        <p className="file-description">
          계약서를 업로드하세요. AI가 핵심 조항과 위험 요소를 즉시 분석합니다. <br />
          지금 바로 스마트 계약서 분석 기능을 이용해 보세요.
        </p>
        <FileUploader onUploadSuccess={handleFileUpload} />
        </div>
      </section>

      {/* 일정 관리 섹션 */}
      <section className="schedule-section">
        <h2 className="section-title">나의 일정 관리</h2>
        <div className="schedule-grid">
          <div className="schedule-card">
            <h3>임박 알림</h3>
          </div>

          <div className="schedule-card">
            <h3>캘린더</h3>
          </div>
        </div>
      </section>

      {/* 계약서 작성 */}
      <section className="contract-section">
        <h2 className="section-title">쉽고 빠른 계약서 작성</h2>
        <div className="contract-box">

          <div className="contract-write">
            <div className="contract-image-box">
               <span>image</span>
            </div>
            <Link to="/" className="contract-button">
              <span className="btn-icon">
                <CiSquarePlus size={25}/>
              </span>
                <span>새 법률 양식 작성</span>
            </Link>
          </div>

          <div className="contract-write">
            <div className="contract-image-box">
              <span>image</span>
            </div>
            <Link to="/" className="contract-button">
              <span className="btn-icon">
                <CiSaveDown2 size={25}/>
              </span>
              <span>법률 양식 다운로드</span>
                 
            </Link>
          </div>
        </div>
          <p className="forms-description">
            필요한 법률 서류를 쉽고 빠르게 작성하거나, 간편한 양식을 다운로드할 수 있습니다.
          </p>
      </section>
      {/* 커뮤니티 */}
      <section className='commu-section'>
        <h2 className="section-title">비슷한 사람들의 사례를 확인해 보세요</h2>
        <div className="commu-grid">

        </div>
      </section>
    </div>
  );
}

export default HomePage;