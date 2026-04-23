import { useState, useEffect } from 'react';
import { IoSearch } from 'react-icons/io5';
import { formsAPI, Form, mockForms } from '../api/form';
import './FormPage.css';

const CATEGORY_OPTIONS = ['전체', '부동산'];
const FORM_TYPE_OPTIONS: Record<string, string[]> = {
  '전체': ['전체'],
  '부동산': ['전체', '임대차계약서', '매매계약서', '전세계약서'],
};

export default function FormPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedFormType, setSelectedFormType] = useState('전체');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchForms = async () => {
    setIsLoading(true);
    try {
      const data = await formsAPI.getForms();
      setForms(data);
    } catch (err) {
      console.error('양식 목록 로딩 실패:', err);
      setForms(mockForms);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleDownload = async (formId: string) => {
    setDownloadingId(formId);
    try {
      const res = await formsAPI.downloadForm(formId);
      // 실제 파일 다운로드 처리
      const link = document.createElement('a');
      link.href = res.downloadUrl;
      link.download = res.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // 다운로드 후 목록 재조회 (downloadCount 갱신)
      await fetchForms();
    } catch (err) {
      console.error('다운로드 실패:', err);
      alert('다운로드에 실패했습니다. 로그인 후 다시 시도해주세요.');
    } finally {
      setDownloadingId(null);
    }
  };

  const filtered = forms
    .filter(f => selectedCategory === '전체' || f.category === selectedCategory)
   .filter(f => selectedFormType === '전체' || f.form_name?.includes(selectedFormType))
.filter(f => !searchQuery || f.form_name?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="form-page">
      <div className="form-container">
        {/* 헤더 */}
        <h1 className="form-page-title">법률 서식</h1>

        {/* 검색 + 필터 */}
        <div className="controls-area">
          <div className="search-box">
            <input
              type="text"
              placeholder="양식을 검색하세요"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button className="search-btn">
              <IoSearch />
            </button>
          </div>
          <div className="filters">
            <select
              className="filter-select"
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setSelectedFormType('전체');
              }}
            >
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
            <select
              className="filter-select"
              value={selectedFormType}
              onChange={e => setSelectedFormType(e.target.value)}
            >
              {(FORM_TYPE_OPTIONS[selectedCategory] || ['전체']).map(opt => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="form-list-header">
            <span className="form-list-count">총 {filtered.length}건</span>
            </div>
        </div>
        {/* 양식 건수 */}
        
        {/* 양식 리스트 */}
        <div className="form-list">
          {isLoading ? (
            <div className="form-empty">로딩 중...</div>
          ) : filtered.length === 0 ? (
            <div className="form-empty">양식이 없습니다.</div>
          ) : (
            filtered.map(form => (
              <div key={form.formId} className="form-card">
                {/* 카테고리 뱃지 */}
                <span className="form-category-badge">{form.category}</span>

                <div className="form-card-divider" />

                {/* 양식명 - 클릭 시 미리보기 */}
                {/* 양식명 */}
                <span className="form-card-title">{form.form_name}</span>
                <div className="form-card-divider" />
                {/* 출처 */}
                <span className="form-card-source">{form.source}</span>
                <div className="form-spacer" />
                {/* 버튼 영역 */}
                <div className="form-card-actions">
                <button
                    className="form-download-btn"
                    onClick={() => handleDownload(form.formId)}
                >
                    다운로드
                </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
