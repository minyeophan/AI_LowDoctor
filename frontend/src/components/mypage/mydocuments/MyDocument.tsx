
import { useState } from 'react';
import DraftTableMUI from './DraftTableMUI';
import StorageTableMUI from './StorageTableMUI';
import '../mydocuments/MyDocument.css';
import { IoSearch } from "react-icons/io5";

export default function Documents() {
  const [activeTab, setActiveTab] = useState<'draft' | 'storage'>('draft');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('recent');

  return (
    <div className="documents-page">
      {/* 헤더 */}
      <header className="documents-header">
        <h1>내 계약서</h1>
      </header>

      {/* 슬라이딩 탭 */}
      <div className="sliding-tabs">
        <div className="tabs-wrapper">
          <button
            className={`tab-btn ${activeTab === 'draft' ? 'active' : ''}`}
            onClick={() => setActiveTab('draft')}
          >
            작성 중
          </button>
          <button
            className={`tab-btn ${activeTab === 'storage' ? 'active' : ''}`}
            onClick={() => setActiveTab('storage')}
          >
            보관함
          </button>
          <div 
            className="tab-slider" 
            style={{
              transform: activeTab === 'draft' ? 'translateX(0)' : 'translateX(100%)'
            }}
          />
        </div>
      </div>

      {/* 필터 & 검색 영역 */}
      <div className="controls-area">
        {/* 검색 */}
        <div className="search-box">
          <input
            type="text"
            placeholder="계약서를 검색하세요"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="search-btn">
            <span><IoSearch /></span>
          </button>
        </div>

        {/* 필터 */}
        <div className="filters">
          <select 
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">계약유형</option>
            <option value="real_estate">부동산</option>
            <option value="employment">근로</option>
            <option value="freelance">프리랜서</option>
            <option value="other">기타</option>
          </select>

          <select 
            className="filter-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="recent">최근순</option>
            <option value="oldest">오래된순</option>
            <option value="name">이름순</option>
          </select>
        </div>

        {/* 작성하기 버튼 */}
        <button className="btn-create">
          +&nbsp; 계약서 작성하기
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="tab-content">
        {activeTab === 'draft' ? <DraftTab /> : <StorageTab />}
      </div>
    </div>
  );
}

// 작성 중 탭
function DraftTab() {
  return (
    <div className="draft-tab">
         <DraftTableMUI />
    </div>
  );
}

// 보관함 탭
function StorageTab() {
  return (
    <div className="storage-tab">
      <StorageTableMUI/>
    </div>
  );
}