import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyCommunity.css';

// ============================
// 타입 정의
// ============================
interface MyPost {
  id: string;
  title: string;
  comments: number;
  date: string;
  views: number;
}

interface MyComment {
  id: string;
  body: string;
  date: string;
  postTitle: string;
  postId: string;
}

// ============================
// mock 데이터 (백엔드 연동 시 API 호출로 교체)
// GET /api/posts/me
// GET /api/comments/me
// GET /api/posts/liked
// ============================
const mockMyPosts: MyPost[] = [
  { id: '1', title: '전세 계약 앞두고 걱정이 너무 많아요...', comments: 15, date: '2026-03-18', views: 320 },
  { id: '2', title: '월세 계약 특약사항 이게 정상인가요?', comments: 8, date: '2026-03-17', views: 210 },
  { id: '3', title: '매매 계약 후 하자 발견했을 때 어떻게 해야 하나요?', comments: 23, date: '2026-03-16', views: 450 },
];

const mockMyComments: MyComment[] = [
  { id: '1', body: '전세보증보험 꼭 가입하세요! HUG나 SGI서울보증 통해서 가입할 수 있어요.', date: '2026-03-18', postTitle: '전세 계약 앞두고 걱정이 너무 많아요...', postId: '1' },
  { id: '2', body: '특약사항은 반드시 법무사나 변호사에게 검토받으시는 게 좋아요.', date: '2026-03-17', postTitle: '월세 계약 특약사항 이게 정상인가요?', postId: '2' },
];

const mockLikedPosts: MyPost[] = [
  { id: '3', title: '매매 계약 후 하자 발견했을 때 어떻게 해야 하나요?', comments: 23, date: '2026-03-16', views: 450 },
  { id: '4', title: '전세보증보험 가입 거절당했어요', comments: 6, date: '2026-03-15', views: 180 },
];

type TabType = 'posts' | 'comments' | 'liked';

export default function MyCommunity() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const currentData = activeTab === 'posts'
    ? mockMyPosts
    : activeTab === 'comments'
    ? mockMyComments
    : mockLikedPosts;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(currentData.map(item => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`${selectedIds.length}개를 삭제하시겠습니까?`)) return;
    // 백엔드 연동 시:
    // selectedIds.forEach(id => communityAPI.deletePost(id) or deleteComment(id))
    alert('삭제됐습니다.');
    setSelectedIds([]);
  };

  const tabs = [
    { key: 'posts' as TabType, label: '작성글' },
    { key: 'comments' as TabType, label: '작성 댓글' },
    { key: 'liked' as TabType, label: '좋아요한 글' },
  ];

  const tabIndex = tabs.findIndex(t => t.key === activeTab);

  return (
    <div className="mycommunity-page">
      {/* 헤더 */}
      <header className="mycommunity-header">
        <h1>커뮤니티 활동</h1>
      </header>

      {/* 탭 */}
      <div className="mycommunity-tabs-wrap">
        <div className="mycommunity-tabs">
          {tabs.map((tab, i) => (
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

      {/* 컨트롤 영역 */}
      <div className="mycommunity-controls">
        <span className="mycommunity-count">
          총 <b>{currentData.length}</b>개
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
            posts={activeTab === 'posts' ? mockMyPosts : mockLikedPosts}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelect={handleSelect}
            onNavigate={(id) => navigate(`/community/${id}`)}
          />
        ) : (
          <CommentTable
            comments={mockMyComments}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onSelect={handleSelect}
            onNavigate={(postId) => navigate(`/community/${postId}`)}
          />
        )}
      </div>
    </div>
  );
}

// ============================
// 게시글 테이블
// ============================
function PostTable({ posts, selectedIds, onSelectAll, onSelect, onNavigate }: {
  posts: MyPost[];
  selectedIds: string[];
  onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelect: (id: string) => void;
  onNavigate: (id: string) => void;
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
          <tr><td colSpan={4} className="mycommunity-empty">작성한 게시글이 없습니다.</td></tr>
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
                  {post.title}
                  <span className="mycommunity-comment-count">[{post.comments}]</span>
                </span>
              </td>
              <td className="col-date">{post.date}</td>
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
function CommentTable({ comments, selectedIds, onSelectAll, onSelect, onNavigate }: {
  comments: MyComment[];
  selectedIds: string[];
  onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelect: (id: string) => void;
  onNavigate: (postId: string) => void;
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
          <tr><td colSpan={4} className="mycommunity-empty">작성한 댓글이 없습니다.</td></tr>
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
                <span className="mycommunity-body">{comment.body}</span>
              </td>
              <td className="col-date">{comment.date}</td>
              <td className="col-post">
                <span className="mycommunity-post-title" onClick={() => onNavigate(comment.postId)}>
                  {comment.postTitle}
                </span>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}