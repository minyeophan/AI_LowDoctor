import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoSearch } from 'react-icons/io5';
import './SearchView.css';

interface CommunityResult {
  id: string;
  type: 'community';
  title: string;
  preview: string;
  date: string;
  views: number;
  comments: number;
}

interface CaseResult {
  id: string;
  type: 'case';
  title: string;
  preview: string;
  court: string;
  date: string;
}

type SearchResult = CommunityResult | CaseResult;

const mockCommunityResults: CommunityResult[] = [
  {
    id: '1',
    type: 'community',
    title: '전세 계약 전 꼭 확인해야 할 등기부등본 보는 법',
    preview: '근저당권이 설정되어 있으면 무조건 위험한 건가요? 전세보증보험 가입도 고려 중인데 등기부등본에서 어떤 부분을 중점적으로 확인해야 하는지...',
    date: '2026-03-28',
    views: 120,
    comments: 5,
  },
  {
    id: '2',
    type: 'community',
    title: '월세 계약서 특약사항에 이런 내용이 있는데 괜찮은 건가요?',
    preview: '집주인이 계약서 특약사항에 세입자는 계약 기간 중 어떠한 이유로도 계약 해지를 요구할 수 없다는 내용을 넣으려고 합니다...',
    date: '2026-03-28',
    views: 85,
    comments: 3,
  },
  {
    id: '3',
    type: 'community',
    title: '법닥으로 계약서 분석해봤는데 실제로 도움이 됐어요',
    preview: '특히 잔금 지급 조건이랑 하자담보책임 관련 조항에서 불리한 부분을 미리 발견해서 계약 전에 수정 요청할 수 있었어요...',
    date: '2026-03-28',
    views: 200,
    comments: 8,
  },
];

const mockCaseResults: CaseResult[] = [
  {
    id: 'c1',
    type: 'case',
    title: '임대차보증금 반환 청구 사건 - 묵시적 갱신 후 해지 통보',
    preview: '임대차 계약이 묵시적으로 갱신된 경우 임차인은 언제든지 계약 해지를 통보할 수 있으며, 통보 후 3개월이 경과하면 해지 효력이 발생한다.',
    court: '대법원',
    date: '2023-05-12',
  },
  {
    id: 'c2',
    type: 'case',
    title: '전세보증금 반환 거부 및 손해배상 청구',
    preview: '임대인이 정당한 사유 없이 전세보증금 반환을 거부한 경우 보증금 반환 의무와 함께 지연손해금을 부담하여야 한다.',
    court: '서울고등법원',
    date: '2022-11-30',
  },
  {
    id: 'c3',
    type: 'case',
    title: '하자담보책임 범위에 관한 분쟁',
    preview: '매매 목적물에 하자가 있는 경우 매도인은 하자담보책임을 지며, 매수인이 하자를 알았거나 과실로 알지 못한 경우에는 책임을 면할 수 있다.',
    court: '수원지방법원',
    date: '2023-02-15',
  },
  {
    id: 'c4',
    type: 'case',
    title: '임대차 계약 갱신 거절의 정당성 판단',
    preview: '임대인이 실제 거주 목적으로 갱신을 거절하였으나 이후 제3자에게 임대한 경우 임차인에게 손해배상 책임을 진다.',
    court: '대법원',
    date: '2023-08-22',
  },
];

export default function SearchView() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'community' | 'case'>('community');
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = () => {
    if (!query.trim()) return;
    // 백엔드 연동 시:
    // community: GET /api/posts?keyword=query
    // case: GET /api/cases?keyword=query
    const communityFiltered = mockCommunityResults.filter(
      r => r.title.includes(query) || r.preview.includes(query)
    );
    const caseFiltered = mockCaseResults.filter(
      r => r.title.includes(query) || r.preview.includes(query)
    );
    setResults([...communityFiltered, ...caseFiltered]);
    setSearched(true);
  };

  const communityResults = results.filter(r => r.type === 'community') as CommunityResult[];
  const caseResults = results.filter(r => r.type === 'case') as CaseResult[];
  const currentResults = activeTab === 'community' ? communityResults : caseResults;

  return (
    <div className="search-view">
      {/* 검색창 */}
      <div className="search-view-header">
        <div className="search-view-input-wrap">
          <input
            className="search-view-input"
            placeholder="계약 관련 키워드를 검색해보세요"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button className="search-view-btn" onClick={handleSearch}>
            <IoSearch size={18} />
          </button>
        </div>
      </div>

      {/* 검색 결과 */}
      {searched && (
        <>
          {/* 탭 */}
          <div className='search-tabs-box'>
            <div className="search-tabs-wrapper">
              <button
                className={`search-tab-btn ${activeTab === 'community' ? 'active' : ''}`}
                onClick={() => setActiveTab('community')}
              >
                커뮤니티
                <span className="search-tab-count">{communityResults.length}</span>
              </button>
              <button
                className={`search-tab-btn ${activeTab === 'case' ? 'active' : ''}`}
                onClick={() => setActiveTab('case')}
              >
                판례
                <span className="search-tab-count">{caseResults.length}</span>
              </button>
              <div
                className="search-tab-slider"
                style={{ transform: activeTab === 'community' ? 'translateX(0)' : 'translateX(100%)' }}
              />
            </div>
          </div>
          {/* 결과 목록 */}
          <div className="example-results">
            {currentResults.length === 0 ? (
              <div className="search-empty">
                <p>검색 결과가 없습니다.</p>
                <p className="search-empty-sub">다른 키워드로 검색해보세요</p>
              </div>
            ) : (
              currentResults.map(result => (
                activeTab === 'community'
                  ? <CommunityCard
                      key={result.id}
                      item={result as CommunityResult}
                      onClick={() => navigate(`/community/${result.id}`)}
                    />
                  : <CaseCard
                      key={result.id}
                      item={result as CaseResult}
                    />
              ))
            )}
          </div>
        </>
      )}

      {/* 초기 상태 */}
      {!searched && (
        <div className="search-initial">
          <div className="search-suggestions">
            {['전세 보증금', '계약 해지', '묵시적 갱신', '하자담보책임', '근저당권'].map(keyword => (
              <button
                key={keyword}
                className="search-suggestion-btn"
                onClick={() => { setQuery(keyword); }}
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================
// 커뮤니티 결과 카드
// ============================
function CommunityCard({ item, onClick }: { item: CommunityResult; onClick: () => void }) {
  return (
    <div className="search-result-card" onClick={onClick}>
      <div className="search-result-type community">커뮤니티</div>
      <h3 className="search-result-title">{item.title}</h3>
      <p className="search-result-preview">{item.preview}</p>
      <div className="search-result-meta">
        <span>{item.date}</span>
        <span>·</span>
        <span>조회 {item.views}</span>
        <span>·</span>
        <span>댓글 {item.comments}</span>
      </div>
    </div>
  );
}

// ============================
// 판례 결과 카드
// ============================
function CaseCard({ item }: { item: CaseResult }) {
  return (
    <div className="search-result-card">
      <div className="search-result-type case">{item.court}</div>
      <h3 className="search-result-title">{item.title}</h3>
      <p className="search-result-preview">{item.preview}</p>
      <div className="search-result-meta">
        <span>{item.date}</span>
      </div>
    </div>
  );
}