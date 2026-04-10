const BASE = 'http://localhost:3001';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const mypageAPI = {
  // 작성 중 목록 - GET /api/mypage?category=draft
  getDrafts: async (sort = 'recent', contractType = '') => {
    const params = new URLSearchParams({ category: 'draft', sort });
    if (contractType && contractType !== '전체') params.append('contractType', contractType);
    const res = await fetch(`${BASE}/api/mypage?${params}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('작성 중 목록 조회 실패');
    return res.json();
  },

  // 보관함 목록 - GET /api/mypage?category=storage
  getStorage: async (sort = 'recent', contractType = '') => {
    const params = new URLSearchParams({ category: 'storage', sort });
    if (contractType && contractType !== '전체') params.append('contractType', contractType);
    const res = await fetch(`${BASE}/api/mypage?${params}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('보관함 목록 조회 실패');
    return res.json();
  },
};