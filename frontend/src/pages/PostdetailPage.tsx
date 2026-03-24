import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Post, mockPosts } from './CommunityPage';
import { IoChevronBackCircle } from "react-icons/io5";
import { IoMdThumbsUp } from "react-icons/io";
import { IoMdThumbsDown } from "react-icons/io";
import './CommunityPage.css';

interface Comment {
  id: string;
  author: string;
  date: string;
  body: string;
  likes: number;
  dislikes: number;
}

// 게시글별 mock 댓글 데이터
const mockCommentsMap: Record<string, Comment[]> = {
  '1': [
    { id: '1', author: '이**', date: '03.18', body: '전세보증보험 꼭 가입하세요! HUG나 SGI서울보증 통해서 가입할 수 있어요.',  likes: 5, dislikes: 0 },
    { id: '2', author: '박**', date: '03.18', body: '전입신고랑 확정일자 받는 거 잊지 마세요. 계약 당일 바로 하시는 게 좋아요.',  likes: 5, dislikes: 0 },
  ],
  '2': [
    { id: '1', author: '김**', date: '03.17', body: '특약사항은 반드시 법무사나 변호사에게 검토받으시는 게 좋아요.' , likes: 5, dislikes: 0},
  ],
  '3': [
    { id: '1', author: '최**', date: '03.16', body: '하자담보책임은 계약서에 명시되어 있으면 청구 가능해요.', likes: 5, dislikes: 0 },
    { id: '2', author: '정**', date: '03.16', body: '사진으로 증거 남겨두시고 내용증명 보내보세요.' , likes: 5, dislikes: 0},
    { id: '3', author: '강**', date: '03.17', body: '민법 580조 하자담보책임 조항 찾아보시면 도움될 거예요.' , likes: 5, dislikes: 0},
  ],
  '7': [
    { id: '1', author: '윤**', date: '03.12', body: '임대차보호법상 보증금 반환 거부는 불법이에요. 내용증명 먼저 보내세요.' , likes: 5, dislikes: 0},
    { id: '2', author: '송**', date: '03.13', body: '법률구조공단에 무료 상담 신청해보세요. 빠르게 도움받을 수 있어요.' , likes: 5, dislikes: 0},
  ],
  '8': [
    { id: '1', author: '홍**', date: '03.11', body: '저도 써봤는데 정말 유용했어요! 특히 불리한 조항 자동 탐지 기능이 좋았습니다.' , likes: 5, dislikes: 0},
    { id: '2', author: '오**', date: '03.11', body: '법닥 덕분에 계약 전에 미리 문제 조항 발견했어요 ㅎㅎ' , likes: 5, dislikes: 0},
  ],
};

export default function PostDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const post = mockPosts.find(p => p.id === id);

  if (!post) {
    return (
      <div className="post-detail-wrapper">
        <div className="post-detail-container">
          <button className="back-btn" onClick={() => navigate('/community')}>
            <span className='back-btn-icon'><IoChevronBackCircle size={'20px'} /></span>
            목록으로
          </button>
          <div className="empty-state">게시글을 찾을 수 없습니다.</div>
        </div>
      </div>
    );
  }

  // 댓글 초기값: 해당 id의 mock 댓글 or 빈 배열
  // 백엔드 연동 시: useEffect(() => { fetch(`/api/posts/${id}/comments`).then(...) }, [id]);
  const initialComments = mockCommentsMap[id ?? ''] ?? [];

  return <PostDetailContent post={post} initialComments={initialComments} />;
}

// 컴포넌트 분리: 백엔드 연동 시 post/comments를 props로 받는 구조 유지
function PostDetailContent({ post, initialComments }: { post: Post; initialComments: Comment[] }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');

// 교체 후
type CommentReaction = { liked: boolean; disliked: boolean };
const [commentReactions, setCommentReactions] = useState<Record<string, CommentReaction>>({});
const handleCommentLike = (commentId: string) => {
  setCommentReactions(prev => ({
    ...prev,
    [commentId]: {
      liked: !prev[commentId]?.liked,
      disliked: false,
    },
  }));
};

const handleCommentDislike = (commentId: string) => {
  setCommentReactions(prev => ({
    ...prev,
    [commentId]: {
      liked: false,
      disliked: !prev[commentId]?.disliked,
    },
  }));
};

  const handleLike = () => {
    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);
  };

  const handleCommentSubmit = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: Date.now().toString(),
      author: '나****',
      date: new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).replace(/\.\s*/g, '-').replace(',', '').trim(),
        body: newComment,
        likes: 0,
        dislikes: 0,
        };
    setComments(prev => [...prev, comment]);
    setNewComment('');
  };

  const categoryColor: Record<string, string> = {
    '부동산': 'cat-blue',
  };

  

  return (
    <div className="post-detail-wrapper">
      <div className="post-detail-container">
        <button className="back-btn" onClick={() => navigate('/community')}>
          <span className='back-btn-icon'>
            <IoChevronBackCircle size={'20px'} />
          </span>
          목록으로
        </button>

        {/* 본문 */}
        <div className="post-detail-card">
          <div className="post-detail-badges">
            <span className={`badge ${categoryColor[post.category]}`}>{post.category}</span>
          </div>
          <h1 className="post-detail-title">{post.title}</h1>
          <div className="post-detail-meta">
            <span>{post.author}</span>
            <span>·</span>
            <span>{post.date}</span>
            <span>·</span>
            <span>조회 {post.views}</span>
            <span>·</span>
            <span>댓글 {comments.length}</span>
          </div>
          <p className="post-detail-body">{post.content}</p>
          <div className="post-detail-actions">
            <button className={`like-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
              ❤ {likes}
            </button>
          </div>
        </div>

        {/* 댓글 */}
        <div className="comments-section">
          <h3 className="comments-title">댓글 {comments.length}개</h3>
          <div className="comment-input-row">
            <input
              className="comment-input"
              placeholder="댓글을 입력하세요"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCommentSubmit()}
            />
            <button className="comment-submit-btn" onClick={handleCommentSubmit}>등록</button>
          </div>
          {comments.length === 0 ? (
            <p className="no-comments">첫 댓글을 남겨보세요!</p>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="comment-item">
                <div className="comment-author-row">
                  <span className="comment-author">{comment.author}</span>
                  <span className="comment-date">{comment.date}</span>
                </div>
                <p className="comment-body">{comment.body}</p>
                <div className="comment-actions">
                <button
                  className={`comment-action-btn ${commentReactions[comment.id]?.liked ? 'liked' : ''}`}
                  onClick={() => handleCommentLike(comment.id)}
                >
                  <IoMdThumbsUp/>
                   {comment.likes + (commentReactions[comment.id]?.liked ? 1 : 0)}
                </button>
                <button
                  className={`comment-action-btn ${commentReactions[comment.id]?.disliked ? 'disliked' : ''}`}
                  onClick={() => handleCommentDislike(comment.id)}
                >
                  <IoMdThumbsDown />
                   {comment.dislikes + (commentReactions[comment.id]?.disliked ? 1 : 0)}
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