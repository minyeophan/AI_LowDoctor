const BASE = import.meta.env.VITE_API_URL || '';
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};
export const mypageAPI = {
  getDrafts: async (sort = 'recent', contractType = '') => {
    const params = new URLSearchParams({ category: 'draft', sort });
    if (contractType && contractType !== '전체') params.append('contractType', contractType);
    const res = await fetch(`${BASE}/api/mypage?${params}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('작성 중 목록 조회 실패');
    return res.json();
  },
  getStorage: async (sort = 'recent', contractType = '') => {
    const params = new URLSearchParams({ category: 'storage', sort });
    if (contractType && contractType !== '전체') params.append('contractType', contractType);
    const res = await fetch(`${BASE}/api/mypage?${params}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('보관함 목록 조회 실패');
    return res.json();
  },
  saveDocument: async (documentId: string) => {
    const res = await fetch(`${BASE}/api/mypage/save`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ documentId }),
    });
    if (!res.ok) throw new Error('문서 저장 실패');
    return res.json();
  },

  // 커뮤니티 보관함 조회
  // tab: 'posts' | 'comments' | 'liked'
  getCommunityArchive: async (tab: 'posts' | 'comments' | 'liked', sort = 'recent') => {
    const params = new URLSearchParams({ tab, sort });
    const res = await fetch(`${BASE}/api/mypage/community?${params}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('커뮤니티 보관함 조회 실패');
    return res.json();
  },

  // 커뮤니티 보관함 삭제
  deleteCommunityArchive: async (tab: 'posts' | 'comments' | 'liked', ids: string[]) => {
    const res = await fetch(`${BASE}/api/mypage/community/delete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ tab, ids }),
    });
    if (!res.ok) throw new Error('커뮤니티 보관함 삭제 실패');
    return res.json();
  },

  deleteDocument: async (documentId: string) => {
  const res = await fetch(`${BASE}/api/mypage/${documentId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('문서 삭제 실패');
  return res.json();
},
};

