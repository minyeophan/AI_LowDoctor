import { useState } from 'react';
import TopMenu from '../components/aidt/TopMenu';
import RightSidebar from '../components/aidt/RightSidebar';
import FloatingButtons from '../components/aidt/FloatingButtons';
import FileUploader from '../components/FileUploader';
import { useDocument } from '../context/DocumentContext';
import { api, ApiError, AnalysisResponse } from '../services/api';
import { UploadResult } from '../types';
import { RiZoomOutFill } from "react-icons/ri";
import { RiZoomInFill } from "react-icons/ri";
import './AiPage.css';

type MenuItem = 'document' | 'summary' | 'danger' | 'guide' | 'search';
type SidebarType = 'chatbot' | 'notification' | null;

function AnalysisPage() {
  const { currentDocument, setCurrentDocument } = useDocument();
  
  const [selectedMenu, setSelectedMenu] = useState<MenuItem>('document');
  const [activeSidebar, setActiveSidebar] = useState<SidebarType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 백엔드 API 사용 여부 확인
  const API_ENABLED = import.meta.env.VITE_API_BASE_URL !== undefined && 
                      import.meta.env.VITE_API_BASE_URL !== '';

  // AI 분석 요청 (백엔드 연결 시에만 작동)
  const requestAnalysis = async () => {
    if (!currentDocument) return;

    if (!API_ENABLED) {
      alert('⚠️ AI 분석은 백엔드 연결이 필요합니다.\n.env 파일에서 VITE_API_BASE_URL을 설정해주세요.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await api.analyzeDocument(currentDocument.documentId);
      setAnalysisData(result);
      console.log('✅ AI 분석 완료:', result);
    } catch (error) {
      console.error('❌ AI 분석 실패:', error);
      if (error instanceof ApiError) {
        alert(`분석 실패: ${error.message}`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 파일 업로드 핸들러
  const handleFileUploadSuccess = async (uploadResult: UploadResult) => {
    setIsLoading(true);
    setError(null);

    // 백엔드 API가 활성화된 경우
    if (API_ENABLED) {
      try {
        const response = await api.uploadDocument(uploadResult.file);
        
        console.log('✅ 백엔드 응답:', response);

        const newDoc = {
          documentId: response.documentId,
          filename: response.filename,
          size: response.size,
          uploadDate: response.uploadDate,
          content: response.extractedText,
          file: uploadResult.file,
        };

        setCurrentDocument(newDoc);
        
      } catch (error) {
        console.error('❌ 업로드 실패:', error);
        
        if (error instanceof ApiError) {
          setError(`업로드 실패: ${error.message}`);
        } else {
          setError('파일 업로드 중 오류가 발생했습니다.');
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 로컬 처리 (기존 방식)
    try {
      const file = uploadResult.file;
      
      if (file.type === 'application/pdf') {
        const content = `📄 PDF 파일: ${file.name}\n\n` +
                        `파일 크기: ${(file.size / 1024).toFixed(2)} KB\n` +
                        `업로드 시간: ${new Date().toLocaleString('ko-KR')}\n\n` +
                        `⚠️ PDF 내용을 보려면 백엔드 연결이 필요합니다.`;
        
        const newDoc = {
          documentId: `doc_${Date.now()}`,
          filename: file.name,
          size: file.size,
          uploadDate: new Date().toISOString(),
          content: content,
          file: file,
        };

        setCurrentDocument(newDoc);
        setIsLoading(false);
        
      } else if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
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

          setCurrentDocument(newDoc);
          setIsLoading(false);
        };

        reader.onerror = () => {
          setError('파일을 읽는 중 오류가 발생했습니다.');
          setIsLoading(false);
        };

        reader.readAsText(file, 'UTF-8');
        
      } else {
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
        setIsLoading(false);
      }
      
    } catch (err) {
      console.error('업로드 에러:', err);
      setError('문서 처리 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  // 메뉴 선택
  const handleMenuSelect = (menu: MenuItem) => {
    if (!currentDocument) {
      alert('⚠️ 먼저 문서를 업로드해주세요!');
      return;
    }
    setSelectedMenu(menu);
  };

  // 사이드바 토글
  const toggleSidebar = (type: 'chatbot' | 'notification') => {
    setActiveSidebar(activeSidebar === type ? null : type);
  };

  // 새 문서 업로드
  const handleNewDocument = () => {
    setCurrentDocument(null);
    setSelectedMenu('document');
    setError(null);
    setAnalysisData(null);
  };

  // 콘텐츠 렌더링
  const renderContent = () => {
    if (!currentDocument) {
      return (
        <div className="content-section upload-prompt">
          <div className="upload-prompt-content">
            <div className="file-uploader-wrapper">
              <FileUploader onUploadSuccess={handleFileUploadSuccess} />
            </div>
          </div>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="content-section">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>문서를 처리하는 중입니다...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="content-section">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>오류가 발생했습니다</h3>
            <p>{error}</p>
            <button className="retry-btn" onClick={handleNewDocument}>
              새 문서 업로드
            </button>
          </div>
        </div>
      );
    }

    switch (selectedMenu) {
      case 'document':
        return (
          <div className="content-section">
            <div className="document-header">
              <h2>📄 {currentDocument.filename}</h2>
              <div className="document-meta">
                <div className='meta-box' >
                  {/* <span>크기: {(currentDocument.size / 1024).toFixed(2)} KB</span> */}
                  <span>업로드: {new Date(currentDocument.uploadDate).toLocaleString('ko-KR')}</span>
                  <div className='zoom-box'>
                    <button>
                      <RiZoomOutFill />
                    </button>
                    <button>
                      <RiZoomInFill />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="document-content">
              <pre>{currentDocument.content}</pre>
            </div>
          </div>
        );

      case 'summary':
        if (isAnalyzing) {
          return (
            <div className="content-section">
              <div className="loading-state">
                <div className="spinner"></div>
                <p>AI가 문서를 분석하는 중입니다...</p>
              </div>
            </div>
          );
        }
        
        return (
          <div className="content-section">
              <h2>📝 요약</h2>
            
            {analysisData ? (
              <div className="summary-content">
                <p>{analysisData.summary}</p>
                <p className="analyzed-time">
                  분석 시간: {new Date(analysisData.analyzedAt).toLocaleString('ko-KR')}
                </p>
              </div>
            ) : (
              <div>
                <p>
                  {API_ENABLED 
                    ? '문서 요약이 아직 생성되지 않았습니다.' 
                    : '⚠️ AI 요약 기능은 백엔드 연결이 필요합니다.'}
                </p>
                {API_ENABLED && (
                  <button onClick={requestAnalysis} className="analyze-btn">
                    AI 분석 시작
                  </button>
                )}
              </div>
            )}
          </div>
        );

      case 'danger':
        if (isAnalyzing) {
          return (
            <div className="content-section">
              <div className="loading-state">
                <div className="spinner"></div>
                <p>위험 요소를 분석하는 중입니다...</p>
              </div>
            </div>
          );
        }
        
        return (
          <div className="content-section">
            <div className='dangerous-box'> 
              {/* 총 위험요소 갯수 */}
              <p>n개의 위험 포인트를 찾았어요</p> 
              <div className='danger-bar'></div>
            </div>

            {analysisData?.dangerPoints && analysisData.dangerPoints.length > 0 ? (
              <div className="danger-points">
                {analysisData.dangerPoints.map((point, index) => (
                  <div 
                    key={index} 
                    className={`danger-item severity-${point.severity}`}
                  >
                    <p>{point.description}</p>
                    <span className="location">위치: {point.location}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <p>
                  {API_ENABLED 
                    ? '위험 요소 분석 결과가 없습니다.' 
                    : '⚠️ 위험 요소 분석은 백엔드 연결이 필요합니다.'}
                </p>
                {API_ENABLED && (
                  <button onClick={requestAnalysis} className="analyze-btn">
                    AI 분석 시작
                  </button>
                )}
              </div>
            )}
          </div>
        );

      case 'guide':
        return (
          <div className="content-section">
            <h2>📖 가이드</h2>
            {analysisData?.recommendations && analysisData.recommendations.length > 0 ? (
              <div className="recommendations">
                <ul>
                  {analysisData.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>
                {API_ENABLED 
                  ? '가이드 정보가 아직 생성되지 않았습니다.' 
                  : '⚠️ 가이드 기능은 백엔드 연결이 필요합니다.'}
              </p>
            )}
          </div>
        );

      case 'search':
        return (
          <div className="content-section">
            <h2>🔍 검색</h2>
            <p>문서 내 검색 기능이 곧 제공됩니다...</p>
          </div>
        );

      default:
        return null;
    }
  };
  return (
    <div className="analysis-page-layout">
      <TopMenu 
        selectedMenu={selectedMenu}
        onMenuSelect={handleMenuSelect}
        isSidebarOpen={activeSidebar !== null}
        isDisabled={!currentDocument}
      />

      <main className={`main-content ${activeSidebar ? 'sidebar-open' : 'sidebar-closed'}`}>
        {renderContent()}
      </main>

      <RightSidebar 
        activeSidebar={activeSidebar}
        onClose={() => setActiveSidebar(null)}
      />

      <FloatingButtons 
        activeSidebar={activeSidebar}
        onToggle={toggleSidebar}
      />
    </div>
  );
}

export default AnalysisPage;