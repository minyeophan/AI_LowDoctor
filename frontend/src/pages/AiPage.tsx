import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FloatingButtons from '../components/aidt/layout/FloatingButtons';
import RightSidebar from '../components/aidt/layout/RightSidebar';
import TopMenu from '../components/aidt/layout/TopMenu';
import AnalysisConfirmModal from '../components/aidt/shared/AnalysisConfirmModal';
import AnalysisLoadingOverlay from '../components/aidt/shared/AnalysisLoadingOverlay';
import LoadingOverlay from '../components/aidt/shared/LoadingOverlay';
import DangerView from '../components/aidt/views/DangerView';
import DocumentEditor, { DocumentEditorRef } from '../components/aidt/views/DocumentEditor';
import GuideView from '../components/aidt/views/GuideView';
import SummaryView from '../components/aidt/views/SummaryView';
import FileUploader from '../components/FileUploader';
import { useDocument , DocumentData } from '../context/DocumentContext';
import { documentsAPI, UploadResponse } from '../api/documents';
import { analyzeAPI, AnalyzeResponse, AnalysisResult } from '../api/analyze';
import { mockContractTip, mockImprovementGuides, mockRiskItems, mockSummaryData } from '../mock/mockData';
import DocumentView from '../components/aidt/views/DocumentView';
import { UploadResult } from '../types';
import './AiPage.css';

type MenuItem = 'document' | 'summary' | 'danger' | 'guide';
type AnalysisType = 'summary' | 'danger' | 'guide' | null;
type SidebarType = 'chatbot' | 'notification' | 'search' | null;


function AnalysisPage() {
  const {currentDocument, setCurrentDocument } = useDocument();
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [activeSidebar, setActiveSidebar] = useState<SidebarType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [pendingAnalysis, setPendingAnalysis] = useState<AnalysisType>(null);
  const [analyzingType, setAnalyzingType] = useState<AnalysisType>(null);
  const [analyzedMenus, setAnalyzedMenus] = useState<Set<string>>(new Set());
  const [editedHtml, setEditedHtml] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const editorRef = useRef<DocumentEditorRef>(null);
  const location = useLocation();

useEffect(() => {
  if (location.state?.autoAnalyze && currentDocument?.documentId) {
    // HomePage에서 넘어온 경우 - 이미 업로드됨, convert만 실행
    const convertExisting = async () => {
      setIsLoading(false);
      setIsConverting(true);
      try {
        const { html } = await documentsAPI.convertDocument(currentDocument.documentId!);
        setEditedHtml(html);
      } catch (e) {
        console.error('HTML 변환 실패:', e);
        setEditedHtml('<p>문서 변환에 실패했습니다. 텍스트를 직접 입력해주세요.</p>');
      } finally {
        setIsConverting(false);
      }
      setSelectedMenu('document');
    };
    convertExisting();
  }
}, []);

const navigate = useNavigate();

// 브라우저 뒤로가기 감지 시 초기화
useEffect(() => {
  const handlePopState = () => {
    setCurrentDocument(null);
    setAnalysisData(null);
    setEditedHtml('');
    setSelectedMenu(null);
    setAnalyzingType(null);
    setAnalyzedMenus(new Set());
    setError(null);
    navigate('/', { replace: true });
  };

  window.addEventListener('popstate', handlePopState);
  return () => {
    window.removeEventListener('popstate', handlePopState);
  };
}, []);

 // 백엔드 API 사용 여부 확인
const API_ENABLED = import.meta.env.VITE_API_BASE_URL !== undefined && 
                    import.meta.env.VITE_API_BASE_URL !== '';

  // AI 분석 요청 (백엔드 연결 시에만 작동)
 const requestAnalysis = async () => {
  if (!currentDocument) return;
  if (!API_ENABLED) {
    alert('⚠️ AI 분석은 백엔드 연결이 필요합니다.');
    return;
  }

  setIsAnalyzing(true);

  try {
    const editedText = editorRef.current?.getHTML() || editedHtml;
    console.log('🔍 분석 요청:', currentDocument.documentId);
    await analyzeAPI.requestAnalysis(currentDocument.documentId, editedText || undefined);

    // polling을 Promise로 감싸서 완료될 때까지 기다림
    await new Promise<void>((resolve, reject) => {
      const pollResult = async () => {
        try {
          const result = await analyzeAPI.getAnalysisResult(currentDocument.documentId);

          if (result.status === 'completed') {
            const parsedResult = {
              ...result,
              summary: typeof result.summary === 'string'
                ? JSON.parse(result.summary)
                : result.summary || []
            };
            setAnalysisData(parsedResult);
            if (result.content) {
              setCurrentDocument({
                ...currentDocument,
                content: result.content,
              } as DocumentData);
            }
            console.log('✅ AI 분석 완료:', result);
            resolve(); // ← 완료 시 Promise 해결
          } else if (result.status === 'failed') {
            reject(new Error(result.errorMessage || '분석 실패'));
          } else {
            console.log('⏳ 분석 진행 중...');
            setTimeout(pollResult, 3000);
          }
        } catch (error) {
          reject(error);
        }
      };
      pollResult();
    });

  } catch (error) {
    console.error('❌ 분석 요청 실패:', error);
    if (error instanceof Error) {
      alert(`분석 실패: ${error.message}`);
    }
  } finally {
    setIsAnalyzing(false); // ← polling 완료 후 실행됨
  }
};

  const handleFileUploadSuccess = async (uploadResult: UploadResult) => {
  setIsLoading(true);
  setError(null);
  try {
    if (!uploadResult.file) {
      console.error('파일이 없습니다');
      return;
    }

    // 1. 업로드
    const response = await documentsAPI.uploadDocument(uploadResult.file);
    const fileUrl = URL.createObjectURL(uploadResult.file);
    console.log('✅ 업로드 응답:', response);

    const documentId = (response.documentId || response.document_id)!;

    // 2. 문서 상태 저장
    const newDoc = {
      documentId,
      status: response.status,
      filename: uploadResult.file.name,
      size: uploadResult.file.size,
      uploadDate: new Date().toISOString(),
      content: '',
      fileUrl,
      file: uploadResult.file,
    };
    setCurrentDocument(newDoc as any);

    // 3. HTML 변환
    setIsLoading(false);
    setIsConverting(true);
    try {
      const { html } = await documentsAPI.convertDocument(documentId);
      setEditedHtml(html);
    } catch (e) {
      console.error('HTML 변환 실패:', e);
      setEditedHtml('<p>문서 변환에 실패했습니다. 텍스트를 직접 입력해주세요.</p>');
    } finally {
      setIsConverting(false);
    }

    setSelectedMenu('document');

  } catch (error) {
    console.error('❌ 업로드 실패:', error);
    if (error instanceof Error) {
      setError(`업로드 실패: ${error.message}`);
    } else {
      setError('파일 업로드 중 오류가 발생했습니다.');
    }
    setAnalyzingType(null);
  } finally {
    setIsLoading(false);
  }
};

// handleMenuSelect 수정
const handleMenuSelect = (menu: MenuItem) => {
  if (!currentDocument) {
    alert('⚠️ 먼저 문서를 업로드해주세요!');
    return;
  }

  if (menu === 'summary' || menu === 'danger' || menu === 'guide') {
  if (analysisData) {
    setSelectedMenu(menu);
    return;
  }
  setPendingAnalysis(menu);
} else {
    setSelectedMenu(menu);
  }
};

// handleAnalysisConfirm 수정
const handleAnalysisConfirm = async () => {
  if (!pendingAnalysis) return;
  const currentAnalysis = pendingAnalysis;
  setAnalyzingType(currentAnalysis);
  setSelectedMenu(currentAnalysis as MenuItem);
  setPendingAnalysis(null);
  try {
    if (API_ENABLED) {
      await requestAnalysis();
    }
    // analyzedMenus 대신 analysisData로 판단하므로 삭제 가능
  } catch (error) {
    console.error('분석 실패:', error);
  } finally {
    setAnalyzingType(null);
  }
};

// 분석 취소
const handleAnalysisCancel = () => {
  setPendingAnalysis(null);
  setSelectedMenu('document');
};

  // 사이드바 토글
  const toggleSidebar = (type: 'chatbot' | 'notification' | 'search') => {
  setActiveSidebar(activeSidebar === type ? null : type);
};

  // 줌 인/아웃 함수
const handleZoomIn = () => {
  setZoomLevel(prev => Math.min(prev + 10, 150)); // 최대 150%
};

const handleZoomOut = () => {
  setZoomLevel(prev => Math.max(prev - 10, 70)); // 최소 70%
};
  // 새 문서 업로드
  const handleNewDocument = () => {
    setCurrentDocument(null);
    setSelectedMenu('document');
    setError(null);
    setAnalysisData(null);
  };

  // 분석 데이터 키 가져오기
const getAnalysisKey = (type: AnalysisType) => {
  switch (type) {
    case 'summary': return 'summary';
    case 'danger': return 'riskItems';
    case 'guide': return 'contractTip';
    default: return null;
  }
};

  // 콘텐츠 렌더링
  const renderContent = () => {
    if (!currentDocument) {
      return (
        <div className="content-section upload-prompt">
          <div className="upload-prompt-content">
            <div className="file-uploader-wrapper">
              <div className="upload-guide">
                <p className="upload-guide-title">계약서 업로드</p>
                <ul className="upload-guide-list">
                  <li>현재 부동산 계약서만 업로드 가능합니다.</li>
                  <li>PDF, HWP, DOC, TXT 파일을 업로드할 수 있습니다.</li>
                  
                </ul>
              </div>
              <FileUploader onUploadSuccess={handleFileUploadSuccess} />

            </div>
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
    // 분석 확인 팝업
  if (pendingAnalysis) {
    return (
      <div className="content-section" style={{ position: 'relative', minHeight: '400px' }}>
        <AnalysisConfirmModal
          onConfirm={handleAnalysisConfirm}
          onCancel={handleAnalysisCancel}
        />
      </div>
    );
  }

  // 변환 로딩
  if (isConverting) {
  return (
    <div className="content-section" style={{ position: 'relative', minHeight: '400px' }}>
      <LoadingOverlay message="계약서를 업로드하는 중입니다..." />
    </div>
  );
}

  // 분석 로딩
  if (analyzingType) {
    return (
      <div className="content-section" style={{ position: 'relative', minHeight: '400px' }}>
        <AnalysisLoadingOverlay />
      </div>
    );
  }
    switch (selectedMenu) {
      case 'document':
        return (
          <DocumentView
            currentDocument={currentDocument}
            zoomLevel={zoomLevel}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            editedHtml={editedHtml}
            editorRef={editorRef}
            onAnalyze={() => setPendingAnalysis('summary')}
            isAnalyzing={isAnalyzing}
          />
        );

      case 'summary':
       const rawSummary = analysisData?.summary;
          let summaryData = mockSummaryData;
          try {
            if (typeof rawSummary === 'string' && (rawSummary as string).length > 0) {
              const parsed = JSON.parse(rawSummary as string);
              summaryData = Array.isArray(parsed) && parsed.length > 0 ? parsed : mockSummaryData;
            } else if (Array.isArray(rawSummary) && rawSummary.length > 0) {
              summaryData = rawSummary as any;
            }
          } catch (e) {
            console.error('summary 파싱 실패, mock 데이터 사용:', e);
            summaryData = mockSummaryData;
          }
      return (
        <SummaryView
          currentDocument={currentDocument}
          summaryData={summaryData}
          zoomLevel={zoomLevel}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
        />
      );

      case 'danger':
    const riskData = analysisData?.riskItems || mockRiskItems;
    return (
      <DangerView
        currentDocument={currentDocument}
        riskData={riskData as any}
        zoomLevel={zoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        editedHtml={editedHtml}
      />
    );

      case 'guide':
        console.log('analysisData:', analysisData); 
  const contractTip = analysisData?.contractTip || mockContractTip;
   const improvementGuides = (analysisData?.improvementGuides || mockImprovementGuides)
    .slice()
    .sort((a, b) => (a.page ?? 0) - (b.page ?? 0)); 
      return (
        <GuideView
          currentDocument={currentDocument}
          contractTip={contractTip}
          improvementGuides={improvementGuides as any}
          zoomLevel={zoomLevel}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          editedHtml={editedHtml}
        />
      );
        
      default:
        return null;
    }
  };
  return (
    <div className="analysis-page-layout">
      <div className='ai-page-wrapper'>
        {/* 왼쪽 영역 (TopMenu + Main Content) */}
        <div className="left-area">
          <TopMenu 
            selectedMenu={selectedMenu}
            onMenuSelect={handleMenuSelect}
            isSidebarOpen={activeSidebar !== null}
            isDisabled={!currentDocument}
          />

          <main className={`main-content ${activeSidebar ? 'sidebar-open' : 'sidebar-closed'}`}>
            {renderContent()}
          </main>
        </div>

     {/* 로딩 오버레이 */}
      {isLoading && <LoadingOverlay message="문서를 처리하는 중입니다..." />}

        {/* 오른쪽 플로팅 버튼 */}
        <RightSidebar 
          activeSidebar={activeSidebar}
          onClose={() => setActiveSidebar(null)}
          documentId={currentDocument?.documentId}
        />

        <FloatingButtons 
          activeSidebar={activeSidebar}
          onToggle={toggleSidebar}
        />
      </div>
     
    </div>
  );
}

export default AnalysisPage;