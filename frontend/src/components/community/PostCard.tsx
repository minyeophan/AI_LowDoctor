import { useNavigate } from 'react-router-dom';
import { Post } from '../../pages/CommunityPage';

interface PostCardProps {
  post: Post;
}

const categoryColor: Record<string, string> = {
  '부동산': 'cat-blue',
  '근로': 'cat-green',
  '기타': 'cat-gray',
};

export default function PostCard({ post }: PostCardProps) {
  const navigate = useNavigate();

  return (
            <div className="post-item">
        <div className="post-item-left">
            <div className="post-badges">
            {post.isBest && <span className="badge badge-best">BEST</span>}
            <span className={`badge ${categoryColor[post.category]}`}>{post.category}</span>
            </div>
            <p className="post-item-title" onClick={() => navigate(`/community/${post.id}`)}>
            {post.title}
            </p>
            <p className="post-item-body" onClick={() => navigate(`/community/${post.id}`)}>
            {post.content}
            </p>
            <div className="post-item-meta">
            <span>{post.author}</span>
            <span>·</span>
            <span>{post.date}</span>
            <span>·</span>
            <span>조회 {post.views}</span>
            <span>·</span>
            <span>댓글 {post.comments}</span>
            <span className="post-likes-spacer" />
            <span className="post-likes">❤ {post.likes}</span>
            </div>
        </div>
        </div>
  );
}