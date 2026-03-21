import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CommunityPage.css';
import { IoSearch } from "react-icons/io5";
import PostCard from '../components/community/PostCard';

export interface Post {
  id: string;
  category: '부동산';
  title: string;
  content: string;
  author: string;
  date: string;
  views: number;
  comments: number;
  likes: number;
  isBest?: boolean;
}

export const mockPosts: Post[] = [
  { id: '1', category: '부동산', title: '전세 계약 앞두고 걱정이 너무 많아요...', content: '이번에 처음으로 전세 계약을 앞두고 있는데요. 집주인이 요구하는 조건들이 다 맞는 건지 모르겠어요. 전세권 설정이나 보증보험 관련하여 세입자가 알아야 할 게 뭔가요?', author: '김**', date: '03.18', views: 320, comments: 15, likes: 22 },
  { id: '2', category: '부동산', title: '월세 계약 특약사항 이게 정상인가요?', content: '집주인이 계약서에 이상한 특약을 넣으려고 하는데, 법적으로 문제가 없는 건지 궁금합니다.', author: '이**', date: '03.17', views: 210, comments: 8, likes: 11 },
  { id: '3', category: '부동산', title: '매매 계약 후 하자 발견했을 때 어떻게 해야 하나요?', content: '계약 후 입주했는데 누수가 발견됐어요. 집주인은 몰랐다고 하는데 책임을 물을 수 있나요?', author: '박**', date: '03.16', views: 450, comments: 23, likes: 35 },
  { id: '4', category: '부동산', title: '전세보증보험 가입 거절당했어요', content: 'HUG 전세보증보험 신청했는데 거절됐습니다. 이유가 뭔지 아시는 분 계신가요?', author: '최**', date: '03.15', views: 180, comments: 6, likes: 8 },
  { id: '5', category: '부동산', title: '공인중개사 없이 직거래 해도 괜찮을까요?', content: '비용 절감하려고 직거래를 고민 중인데, 위험하진 않을지 걱정됩니다.', author: '정**', date: '03.14', views: 270, comments: 12, likes: 17 },
];


const CATEGORIES = ['전체', '부동산'];
const SORT_OPTIONS = ['최신순', '조회순', '댓글순'];

// 베스트 게시글 가중치 계산
export const calcScore = (post: Post) =>
  post.likes * 0.6 + post.comments * 0.3 + post.views * 0.1;

export const getBestPost = () =>
  [...mockPosts].sort((a, b) => calcScore(b) - calcScore(a))[0];

export default function CommunityPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [sortBy, setSortBy] = useState('최신순');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const TOTAL_PAGES = 10;
  const POSTS_PER_PAGE = 5;

  // 베스트 게시글: 가중치 점수 가장 높은 게시글 자동 선정
  const bestPost = getBestPost();

  // 필터링
  const filteredPosts = mockPosts.filter(post => {
    const categoryMatch = selectedCategory === '전체' || post.category === selectedCategory;
    const searchMatch = post.title.includes(searchQuery) || post.content.includes(searchQuery);
    return categoryMatch && searchMatch;
  });

  // 정렬
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === '조회순') return b.views - a.views;
    if (sortBy === '댓글순') return b.comments - a.comments;
    // 최신순: id 내림차순 (실제 API 연동 시 date 기준으로 변경)
    return Number(b.id) - Number(a.id);
  });

  const totalPages = Math.ceil(sortedPosts.length / POSTS_PER_PAGE);
const pagedPosts = sortedPosts.slice(
  (currentPage - 1) * POSTS_PER_PAGE,
  currentPage * POSTS_PER_PAGE
);

  const categoryColor: Record<string, string> = {
    '부동산': 'cat-blue',
  };

  const renderPagination = () => {
  const pages = [];
  pages.push(
    <button key="first" className="page-btn page-arrow" onClick={() => setCurrentPage(1)}>«</button>,
    <button key="prev" className="page-btn page-arrow" onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>‹</button>
  );
  for (let i = 1; i <= totalPages; i++) {
    pages.push(
      <button
        key={i}
        className={`page-btn ${currentPage === i ? 'active' : ''}`}
        onClick={() => setCurrentPage(i)}
      >
        {i}
      </button>
    );
  }
  pages.push(
    <button key="next" className="page-btn page-arrow" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>›</button>,
    <button key="last" className="page-btn page-arrow" onClick={() => setCurrentPage(totalPages)}>»</button>
  );
  return pages;
};

  return (
    <div className="community-wrapper">
      <div className="community-container">
        {/* 헤더 */}
        <div className="community-header">
          <h1 className="community-title">커뮤니티</h1>
          <button className="write-btn" onClick={() => navigate('/community/write')}>
            글쓰기
          </button>
        </div>

        {/* 베스트 게시글 */}
        {bestPost && (
          <div className="best-post-card" onClick={() => navigate(`/community/${bestPost.id}`)}>
            <div className="best-post-badges">
              <span className="badge badge-best">BEST</span>
              <span className={`badge ${categoryColor[bestPost.category]}`}>{bestPost.category}</span>
            </div>
            <div className="best-post-content">
              <p className="best-post-title">{bestPost.title}</p>
              <p className="best-post-body">{bestPost.content}</p>
            </div>
            <div className="best-post-meta">
              <span>{bestPost.author}</span>
              <span>·</span>
              <span>{bestPost.date}</span>
              <span>·</span>
              <span>조회 {bestPost.views}</span>
              <span className="meta-likes">❤ {bestPost.likes}</span>
            </div>
          </div>
        )}

        {/* 검색 + 필터 */}
        <div className="search-filter-row">
          <div className="search-box">
            <input
              type="text"
              placeholder="커뮤니티 검색하기"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            <span className="search-icon">
              <IoSearch />
            </span>
          </div>
          <select className="filter-select" value={sortBy} onChange={e => {
            setSortBy(e.target.value);
            setCurrentPage(1);
          }}>
            {SORT_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
          </select>
          <select className="filter-select" value={selectedCategory} onChange={e => {
            setSelectedCategory(e.target.value);
            setCurrentPage(1);
          }}>
            {CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
          </select>
        </div>

        {/* 게시글 목록 */}
        <div className="post-list">
          {pagedPosts.length === 0 ? (
            <div className="empty-state">게시글이 없습니다.</div>
          ) : (
            pagedPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>

        {/* 페이지네이션 */}
        <div className="pagination">
          {renderPagination()}
        </div>
      </div>
    </div>
  );
}