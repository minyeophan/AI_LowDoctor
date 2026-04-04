import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CommunityPage.css';
import { IoSearch } from "react-icons/io5";
import PostCard from '../components/community/PostCard';
import { communityAPI} from '../api/community';


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

const CATEGORIES = ['전체', '부동산'];
const SORT_OPTIONS = ['최신순', '조회순', '댓글순'];

export default function CommunityPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [bestPost, setBestPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [sortBy, setSortBy] = useState('최신순');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const TOTAL_PAGES = 10;
  const POSTS_PER_PAGE = 10;

 // 교체 후
useEffect(() => {
  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const sortParam = sortBy === '조회순' ? 'views' : sortBy === '댓글순' ? 'comments' : 'latest';
      const data = await communityAPI.getPosts(sortParam, selectedCategory, searchQuery);
      setPosts(data);
    } catch (err) {
      console.error('게시글 로딩 실패:', err);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };
  fetchPosts();
  setCurrentPage(1);
}, [sortBy, selectedCategory, searchQuery]);

useEffect(() => {
  const fetchBest = async () => {
    try {
      const data = await communityAPI.getBestPost();
      setBestPost(data);
    } catch (err) {
      setBestPost(null);
    }
  };
  fetchBest();
}, []);

const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
const pagedPosts = posts.slice(
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
          {isLoading ? (
            <div className="empty-state">로딩 중...</div>
          ) : pagedPosts.length === 0 ? (
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