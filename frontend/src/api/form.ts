const BASE = 'http://localhost:3001';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface Form {
  formId: string;
  form_name: string;
  category: string;
  source: string;
  save_date: string;
  downloadCount: number;
}

export interface DownloadResponse {
  message: string;
  downloadUrl: string;
  fileName: string;
}

export const formsAPI = {
  // 양식 목록 조회 - GET /api/forms
  getForms: async (): Promise<Form[]> => {
    const res = await fetch(`${BASE}/api/form`, { headers: getHeaders() });
    if (!res.ok) throw new Error('양식 목록 조회 실패');
    return res.json();
  },

  // 양식 다운로드 - GET /api/forms/download/:id
  downloadForm: async (formId: string): Promise<DownloadResponse> => {
    const res = await fetch(`${BASE}/api/form/download/${formId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('다운로드 실패');
    return res.json();
  },
};

export const mockForms: Form[] = [
  {
    formId: 'mock-1',
    form_name: '건물임대차계약서',
    category: '부동산',
    source: '대한법률구조공단',
    save_date: '2026-04-07',
    downloadCount: 0,
  },
];