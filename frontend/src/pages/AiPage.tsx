import { useState } from 'react';
import FloatingButtons from '../components/aidt/layout/FloatingButtons';
import RightSidebar from '../components/aidt/layout/RightSidebar';
import TopMenu from '../components/aidt/layout/TopMenu';
import AnalysisConfirmModal from '../components/aidt/shared/AnalysisConfirmModal';
import AnalysisLoadingOverlay from '../components/aidt/shared/AnalysisLoadingOverlay';
import LoadingOverlay from '../components/aidt/shared/LoadingOverlay';
import DangerView from '../components/aidt/views/DangerView';
import DocumentView from '../components/aidt/views/DocumentView';
import GuideView from '../components/aidt/views/GuideView';
import SummaryView from '../components/aidt/views/SummaryView';
import FileUploader from '../components/FileUploader';
import { useDocument } from '../context/DocumentContext';
import { AnalysisResponse, api, ApiError } from '../services/api';
import { mockContractTip, mockImprovementGuides, mockRiskItems, mockSummaryData } from '../services/mockData';
import { UploadResult } from '../types';
import './AiPage.css';

type MenuItem = 'document' | 'summary' | 'danger' | 'guide' | 'search';
type AnalysisType = 'summary' | 'danger' | 'guide' | null;
type SidebarType = 'chatbot' | 'notification' | null;

function AnalysisPage() {
  const {currentDocument, setCurrentDocument } = useDocument();
  const [selectedMenu, setSelectedMenu] = useState<MenuItem>('document');
  const [activeSidebar, setActiveSidebar] = useState<SidebarType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
<<<<<<< Updated upstream
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null);
=======
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
>>>>>>> Stashed changes
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [pendingAnalysis, setPendingAnalysis] = useState<AnalysisType>(null);
  const [analyzingType, setAnalyzingType] = useState<AnalysisType>(null);
  const [analyzedMenus, setAnalyzedMenus] = useState<Set<string>>(new Set());
<<<<<<< Updated upstream

=======
  const location = useLocation();

useEffect(() => {
  if (location.state?.autoAnalyze && currentDocument?.documentId) {
    setAnalyzingType('summary');
    setTimeout(() => {
      handleFileUploadSuccess({ file: currentDocument.file } as any);
    }, 0);
  }
}, []);
>>>>>>> Stashed changes
  
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
    // ✅ documentId로 분석 결과 조회 (polling 방식)
    console.log('🔍 분석 결과 조회:', currentDocument.documentId);
    const result = await api.getAnalysisResult(currentDocument.documentId);
    
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

  try {
    // 항상 api.uploadDocument 사용 (Mock 또는 실제 API)
    const response = await api.uploadDocument(uploadResult.file);
    
    console.log('✅ 업로드 응답:', response);
<<<<<<< Updated upstream
    console.log('📝 content:', response.content);
=======
    
    const documentId = response.document_id!; // ! 로 undefined 제거
>>>>>>> Stashed changes

    const newDoc = {
      documentId: response.document_id,
      status: response.status,
      filename: uploadResult.file.name,
      size: uploadResult.file.size,
      uploadDate: new Date().toISOString(),
      content: response.content || '',
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
};

//메뉴 선택
  const handleMenuSelect = (menu: MenuItem) => {
  if (!currentDocument) {
    alert('⚠️ 먼저 문서를 업로드해주세요!');
    return;
  }

  // 분석이 필요한 메뉴
  if (menu === 'summary' || menu === 'danger' || menu === 'guide') {
    // 이미 분석된 메뉴인지 확인
    if (analyzedMenus.has(menu)) {
      setSelectedMenu(menu);
      return;
    }
    
    // 분석 확인 팝업 표시
    setPendingAnalysis(menu);
  } else {
    setSelectedMenu(menu);
  }
};

// 분석 확인
// 분석 확인
const handleAnalysisConfirm = async () => {
  if (!pendingAnalysis) return;

  const currentAnalysis = pendingAnalysis;
  setAnalyzingType(currentAnalysis);
  setSelectedMenu(currentAnalysis);
  setPendingAnalysis(null);

  try {
<<<<<<< Updated upstream
    // 2초 로딩 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 분석 데이터 초기화 (첫 분석인 경우)
    if (!analysisData) {
      setAnalysisData({
        summary: [],
        riskItems: [],
        recommendations: [],
        forms: [],
        analyzedAt: new Date().toISOString(),
        contractTip: undefined,
      });
    }

    // 선택한 메뉴 데이터만 설정
    setAnalysisData(prev => {
      const newData = prev || {
        summary: [],
        riskItems: [],
        recommendations: [],
        forms: [],
        analyzedAt: new Date().toISOString(),
            contractTip: {            
            docType: '',
            title: '',
            items: []
        },
      };

      switch (currentAnalysis) {
        case 'summary':
          return { ...newData, summary: mockSummaryData };
        case 'danger':
          return { ...newData, riskItems: mockRiskItems };
        case 'guide':
          return { ...newData, contractTip: mockContractTip };
        default:
          return newData;
      }
    });
    
    // 분석 완료 메뉴 추가
    setAnalyzedMenus(prev => new Set(prev).add(currentAnalysis));
    
=======
   
>>>>>>> Stashed changes
    // 백엔드 연결시 실제 API 호출
    if (API_ENABLED) {
      await requestAnalysis();
    }
     setAnalyzedMenus(prev => new Set(prev).add(currentAnalysis));
  } catch (error) {
    console.error('분석 실패:', error);
  } finally {
    setAnalyzingType(null);
  }
};


// 분석 취소
const handleAnalysisCancel = () => {
  setPendingAnalysis(null);
};

  // 사이드바 토글
  const toggleSidebar = (type: 'chatbot' | 'notification') => {
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
          type={pendingAnalysis}
          onConfirm={handleAnalysisConfirm}
          onCancel={handleAnalysisCancel}
        />
      </div>
    );
  }

  // 분석 로딩
  if (analyzingType) {
    return (
      <div className="content-section" style={{ position: 'relative', minHeight: '400px' }}>
        <AnalysisLoadingOverlay type={analyzingType} />
      </div>
    );
  }
    switch (selectedMenu) {
      case 'document': // 본문
        return (
          <DocumentView
          currentDocument={currentDocument}
          zoomLevel={zoomLevel}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
        />
        );

      case 'summary':
       const summaryData = analysisData?.summary?.length ? analysisData.summary : mockSummaryData;
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
        const riskData = analysisData?.riskItems?.length ? analysisData.riskItems : mockRiskItems;
      return (
        <DangerView
          currentDocument={currentDocument}
          riskData={riskData}
          zoomLevel={zoomLevel}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
        />
      );

      case 'guide':
  const contractTip = analysisData?.contractTip || mockContractTip;
   const improvementGuides = (analysisData?.improvementGuides || mockImprovementGuides)
    .slice()
    .sort((a, b) => (a.page ?? 0) - (b.page ?? 0)); 
      return (
        <GuideView
          currentDocument={currentDocument}
          contractTip={contractTip}
          improvementGuides={improvementGuides}
          zoomLevel={zoomLevel}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
        />
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