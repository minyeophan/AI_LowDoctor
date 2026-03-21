import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FileUploader from '../components/FileUploader';
import { useDocument } from '../context/DocumentContext';
import { UploadResult } from '../types';
import {documentsAPI} from '../api/documents'
import { analyzeAPI } from '../api/analyze'
import { CiSquarePlus } from "react-icons/ci";
import { CiSaveDown2 } from "react-icons/ci";
import { mockPosts, getBestPost } from './CommunityPage';
import PostCard from '../components/community/PostCard';

import './HomePage.css';

function HomePage() {
  const navigate = useNavigate();
  const { setCurrentDocument } = useDocument();
  const [isUploading, setIsUploading] = useState(false);

  // 백엔드 API 사용 여부 확인
  const API_ENABLED = import.meta.env.VITE_API_BASE_URL !== undefined && 
                      import.meta.env.VITE_API_BASE_URL !== '';

   const handleFileUpload = async (uploadResult: UploadResult) => {
    console.log('📤 파일 업로드 시작:', uploadResult.file?.name);

    const file = uploadResult.file;

     if (!file) {
    console.error('파일이 없습니다');
    return;
  }
    setIsUploading(true);


    try {
      console.log('🌐 api.uploadDocument 호출 중...');
      
      // api.ts의 uploadDocument 사용
      const response = await documentsAPI.uploadDocument(file);
      const fileUrl = URL.createObjectURL(file);
      console.log('✅ 업로드 완료:', response);

      const content = await file.text(); 
      // Context에 문서 저장
      const newDoc = {
        documentId: response.documentId || '',
        filename: file.name,
        size: file.size,
        uploadDate: new Date().toISOString(),
        content: response.content || '',
          fileUrl,
        file: file,
      };

      setCurrentDocument(newDoc);
      navigate('/analysis', { state: { autoAnalyze: true } });

    } catch (error) {
      console.error('❌ 업로드 실패:', error);
      
      if (error instanceof Error) {
        alert(`업로드 실패: ${error.message}`);
      } else {
        alert('파일 업로드 중 오류가 발생했습니다.');
      }
    } finally {
      setIsUploading(false);
    }
  };
  return (
    <div className="home-page">
      {/* 파일 업로드 섹션 */}
      <section className="upload-section">
        <div className='file-upload-box'>
          <div className='upload-section-box'>
            <h2 className="file-title">AIDT</h2>
            <p className="file-description">
              계약서를 업로드하세요 <br />
              AI가 핵심 조항과 위험 요소를 분석해드립니다
            </p>
            <FileUploader onUploadSuccess={handleFileUpload} />
          </div>
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
          {(() => {
            const bestPost = getBestPost();
            const otherPosts = mockPosts.filter(p => p.id !== bestPost.id);
            const randomPost = otherPosts[Math.floor(Math.random() * otherPosts.length)];

            return (
              <div className="commu-list">
                <div className="commu-item">
                  <PostCard post={{ ...bestPost, isBest: true }} />
                </div>
                <div className="commu-divider" />
                <div className="commu-item">
                  <PostCard post={randomPost} />
                </div>
              </div>
            );
          })()}
        </div>
        <div className="commu-more">
          <button className="commu-more-btn" onClick={() => navigate('/community')}>
            커뮤니티 바로가기
          </button>
        </div>
      </section>
    </div>
  );
}

export default HomePage;