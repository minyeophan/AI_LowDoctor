// src/api/community.ts
const API_BASE = import.meta.env.VITE_API_URL || '';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const communityAPI = {
  // 게시글 목록
  getPosts: async (sort = 'latest', category = '', keyword = '') => {
    const params = new URLSearchParams();
    if (sort) params.append('sort', sort);
    if (category && category !== '전체') params.append('category', category);
    if (keyword) params.append('keyword', keyword);
    const res = await fetch(`${API_BASE}/api/posts?${params}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('게시글 목록 조회 실패');
    return res.json();
  },

  // 베스트 게시글
  getBestPost: async () => {
    const res = await fetch(`${API_BASE}/api/posts/best`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('베스트 게시글 조회 실패');
    return res.json();
  },

  // 게시글 상세
  getPost: async (id: string) => {
    const res = await fetch(`${API_BASE}/api/posts/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('게시글 조회 실패');
    return res.json();
  },

  // 게시글 작성
  createPost: async (data: { title: string; content: string; category: string }) => {
    const res = await fetch(`${API_BASE}/api/posts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('게시글 작성 실패');
    return res.json();
  },

  // 게시글 좋아요
  toggleLike: async (id: string) => {
    const res = await fetch(`${API_BASE}/api/posts/${id}/like`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('좋아요 실패');
    return res.json();
  },

  // 댓글 목록
  getComments: async (postId: string) => {
    const res = await fetch(`${API_BASE}/api/posts/${postId}/comments`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('댓글 조회 실패');
    return res.json();
  },

  // 댓글 작성
  createComment: async (postId: string, content: string) => {
    const res = await fetch(`${API_BASE}/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error('댓글 작성 실패');
    return res.json();
  },

  // 댓글 좋아요
  toggleCommentLike: async (commentId: string) => {
    const res = await fetch(`${API_BASE}/api/posts/comments/${commentId}/like`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('댓글 좋아요 실패');
    return res.json();
  },
};