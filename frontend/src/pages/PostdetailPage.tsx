import { useState , useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Post} from './CommunityPage';
import { IoChevronBackCircle } from "react-icons/io5";
import { IoMdThumbsUp } from "react-icons/io";
import { communityAPI } from '../api/community';
import './CommunityPage.css';

interface Comment {
  id: string;
  author: string;
  date: string;
  body: string;
  likes: number;
  dislikes: number;
}


export default function PostDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [initialComments, setInitialComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setIsLoading(true);
      try {
        const [postData, commentsData] = await Promise.all([
          communityAPI.getPost(id),
          communityAPI.getComments(id),
        ]);
        setPost(postData);
        setInitialComments(commentsData);
      } catch (err) {
        console.error('게시글 로딩 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (isLoading) {
    return (
      <div className="post-detail-wrapper">
        <div className="post-detail-container">
          <div className="empty-state">로딩 중...</div>
        </div>
      </div>
    );
  }

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

  return <PostDetailContent post={post} initialComments={initialComments} />;
}

// 컴포넌트 분리: 백엔드 연동 시 post/comments를 props로 받는 구조 유지
function PostDetailContent({ post, initialComments }: { post: Post; initialComments: Comment[] }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');

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

 const handleLike = async () => {
  try {
    const result = await communityAPI.toggleLike(post.id);
    setLiked(result.liked);
    setLikes(result.likesCount);
  } catch (err) {
    console.error('좋아요 실패:', err);
  }
};

  const handleCommentSubmit = async () => {
  if (!newComment.trim()) return;
  try {
    // 백엔드 연동
    const comment = await communityAPI.createComment(post.id, newComment);
    setComments(prev => [...prev, {
      id: comment.id,
      author: comment.author,
      date: comment.date,
      body: comment.content,
      likes: 0,
      dislikes: 0,
    }]);
    setNewComment('');
  } catch (err) {
    alert('댓글 등록에 실패했습니다.');
  }
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
              </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}