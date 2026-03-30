import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from '../assets/img/logo.svg';
import { communityAPI } from '../api/community';
import './CommunityPage.css';

const CATEGORIES = ['부동산'];

export default function WritePostPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('부동산');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const isValid = title.trim().length > 0 && content.trim().length > 0 && agreed;

const handleSubmit = async () => {
  if (!isValid) return;
  setIsSubmitting(true);
  try {
    await communityAPI.createPost({ category, title, content });
    navigate('/community');
  } catch (error) {
    console.error('게시글 등록 실패:', error);
    alert('게시글 등록에 실패했습니다. 다시 시도해주세요.');
  } finally {
    setIsSubmitting(false);
  }
};

  return (
     <div className="write-wrapper">
        <div className="write-container">

        {/* 커스텀 헤더 */}
        <div className="write-header">
            <button className="write-home-btn" onClick={() => navigate('/')}>
             <img src={logoImage} alt="로고" className="logo-svg" />
            법닥
            </button>
            <h1 className="write-title-text">게시글 작성</h1>
            <button
            className="write-submit-btn-header"
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            >
            {isSubmitting ? '등록 중...' : '등록하기'}
            </button>
        </div>

        <div className="write-card">
        
          {/* 카테고리 */}
          <div className="write-field">
            <label className="write-label">카테고리</label>
            <select
              className="write-select"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* 제목 */}
          <div className="write-field">
            <div className="write-label-row">
            <label className="write-label">제목</label>
            {/* 글자수 카운터 */}
                <span className="write-char-count">{title.length}/60</span></div>
            <input
                className="write-input"
                placeholder="제목을 입력하세요 (최대 60자)"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={60}
                />
                
          </div>

          {/* 본문 */}
          <div className="write-field">
            <label className="write-label">내용</label>
            <textarea
              className="write-textarea"
              placeholder="내용을 입력하세요"
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>
        </div>
        {/* 안내사항 */}
            <div className="write-guide">
            <p className="write-guide-title">커뮤니티 이용 안내</p>
            <ul className="write-guide-list">
                <li>본 커뮤니티는 법률 계약서 관련 정보 공유 및 질문을 위한 공간입니다.</li>
                <li>게시글에 작성된 내용은 법률 자문이 아니며 법적 효력이 없습니다. 중요한 사안은 반드시 전문가와 상담하세요.</li>
                <li>계약서 상의 주소, 이름, 금액 등 개인정보가 포함된 내용은 게시를 자제해 주세요.</li>
                <li>욕설, 비방, 허위사실 유포, 광고성 게시글은 사전 통보 없이 삭제되며 이용이 제한될 수 있습니다.</li>
            </ul>
            <label className="write-guide-check">
                <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                />
                <span>위 안내사항을 확인하였으며, 이에 동의합니다.</span>
            </label>
            </div>
      </div>
    </div>
  );
}