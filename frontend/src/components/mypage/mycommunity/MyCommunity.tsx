import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { mypageAPI } from '../../../api/mypage';
import './MyCommunity.css';

// ============================
// 타입 정의
// ============================
interface MyPost {
  id: string;
  title: string;
  commentCount?: number;
  comments?: number;
  createdAt?: string;
  date?: string;
  views: number;
}

interface MyComment {
  id: string;
  postId: string;
  content?: string;
  body?: string;
  createdAt?: string;
  date?: string;
  title: string;
}

type TabType = 'posts' | 'comments' | 'liked';

const tabs = [
  { key: 'posts' as TabType, label: '작성글' },
  { key: 'comments' as TabType, label: '작성 댓글' },
  { key: 'liked' as TabType, label: '좋아요한 글' },
];

const EMPTY_MESSAGES: Record<TabType, string> = {
  posts: '작성한 게시글이 없습니다.',
  comments: '작성한 댓글이 없습니다.',
  liked: '좋아요한 게시글이 없습니다.',
};

export default function MyCommunity() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [data, setData] = useState<(MyPost | MyComment)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (tab: TabType) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await mypageAPI.getCommunityArchive(tab);
      setData(res.list || []);
    } catch (e) {
      console.error('커뮤니티 보관함 조회 실패:', e);
      setError('데이터를 불러오지 못했습니다.');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeTab);
    setSelectedIds([]);
  }, [activeTab, fetchData]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(data.map(item => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`${selectedIds.length}개를 삭제하시겠습니까?`)) return;
    try {
      await mypageAPI.deleteCommunityArchive(activeTab, selectedIds);
      setSelectedIds([]);
      fetchData(activeTab);
    } catch (e) {
      console.error('삭제 실패:', e);
      alert('삭제에 실패했습니다.');
    }
  };

  const tabIndex = tabs.findIndex(t => t.key === activeTab);
  const emptyMessage = isLoading ? '불러오는 중...' : error ?? EMPTY_MESSAGES[activeTab];

  return (
    <div className="mycommunity-page">
      <header className="mycommunity-header">
        <h1>커뮤니티 활동</h1>
      </header>

      {/* 탭 */}
      <div className="mycommunity-tabs-wrap">
        <div className="mycommunity-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`mycommunity-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab.key); setSelectedIds([]); }}
            >
              {tab.label}
            </button>
          ))}
          <div
            className="mycommunity-tab-slider"
            style={{ transform: `translateX(${tabIndex * 100}%)`, width: `${100 / tabs.length}%` }}
          />
        </div>
      </div>

      {/* 컨트롤 */}
      <div className="mycommunity-controls">
        <span className="mycommunity-count">
          총 <b>{data.length}</b>개
        </span>
        <button
          className="mycommunity-delete-btn"
          onClick={handleDelete}
          disabled={selectedIds.length === 0}
        >
          삭제
        </button>
      </div>

      {/* 테이블 */}
      <div className="mycommunity-table-wrap">
        {activeTab === 'posts' || activeTab === 'liked' ? (
          <PostTable
            posts={isLoading || error ? [] : data as MyPost[]}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelect={handleSelect}
            onNavigate={(id) => navigate(`/community/${id}`)}
            emptyMessage={emptyMessage}
          />
        ) : (
          <CommentTable
            comments={isLoading || error ? [] : data as MyComment[]}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelect={handleSelect}
            onNavigate={(postId) => navigate(`/community/${postId}`)}
            emptyMessage={emptyMessage}
          />
        )}
      </div>
    </div>
  );
}

// ============================
// 게시글 테이블
// ============================
function PostTable({ posts, selectedIds, onSelectAll, onSelect, onNavigate, emptyMessage }: {
  posts: MyPost[];
  selectedIds: string[];
  onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelect: (id: string) => void;
  onNavigate: (id: string) => void;
  emptyMessage: string;
}) {
  return (
    <table className="mycommunity-table">
      <thead>
        <tr>
          <th className="col-check">
            <input
              type="checkbox"
              onChange={onSelectAll}
              checked={selectedIds.length === posts.length && posts.length > 0}
            />
          </th>
          <th className="col-title">제목</th>
          <th className="col-date">작성일</th>
          <th className="col-views">조회</th>
        </tr>
      </thead>
      <tbody>
        {posts.length === 0 ? (
          <tr>
            <td colSpan={4} className="mycommunity-empty-cell">
              {emptyMessage}
            </td>
          </tr>
        ) : (
          posts.map(post => (
            <tr key={post.id} className={selectedIds.includes(post.id) ? 'selected' : ''}>
              <td className="col-check">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(post.id)}
                  onChange={() => onSelect(post.id)}
                />
              </td>
              <td className="col-title">
                <span className="mycommunity-title" onClick={() => onNavigate(post.id)}>
                  <span className="mycommunity-title-text">{post.title}</span>
                  <span className="mycommunity-comment-count">
                    [{post.commentCount ?? post.comments ?? 0}]
                  </span>
                </span>
              </td>
              <td className="col-date">{post.createdAt ?? post.date ?? '-'}</td>
              <td className="col-views">{post.views}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

// ============================
// 댓글 테이블
// ============================
function CommentTable({ comments, selectedIds, onSelectAll, onSelect, onNavigate, emptyMessage }: {
  comments: MyComment[];
  selectedIds: string[];
  onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelect: (id: string) => void;
  onNavigate: (postId: string) => void;
  emptyMessage: string;
}) {
  return (
    <table className="mycommunity-table">
      <thead>
        <tr>
          <th className="col-check">
            <input
              type="checkbox"
              onChange={onSelectAll}
              checked={selectedIds.length === comments.length && comments.length > 0}
            />
          </th>
          <th className="col-body">댓글 내용</th>
          <th className="col-date">작성일</th>
          <th className="col-post">댓글 단 게시글</th>
        </tr>
      </thead>
      <tbody>
        {comments.length === 0 ? (
          <tr>
            <td colSpan={4} className="mycommunity-empty-cell">
              {emptyMessage}
            </td>
          </tr>
        ) : (
          comments.map(comment => (
            <tr key={comment.id} className={selectedIds.includes(comment.id) ? 'selected' : ''}>
              <td className="col-check">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(comment.id)}
                  onChange={() => onSelect(comment.id)}
                />
              </td>
              <td className="col-body">
                <span className="mycommunity-body-text">
                  {comment.content ?? comment.body}
                </span>
              </td>
              <td className="col-date">{comment.createdAt ?? comment.date ?? '-'}</td>
              <td className="col-post">
                <span className="mycommunity-post-title" onClick={() => onNavigate(comment.postId)}>
                  {comment.title}
                </span>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}