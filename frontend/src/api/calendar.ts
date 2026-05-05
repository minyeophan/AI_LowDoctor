const BASE = import.meta.env.VITE_API_URL || '';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface ScheduleResponse {
  _id: string;
  userId: string;
  scheduleName: string;
  startDate: string;
  endDate: string;
  alarm: number;
  alarmEnabled: boolean;
  googleEventId?: string;
  createdAt: string;
}

export const calendarAPI = {
  // 일정 목록 조회
  getSchedules: async (): Promise<{ success: boolean; total: number; list: ScheduleResponse[] }> => {
    const res = await fetch(`${BASE}/api/calendar`, { headers: getHeaders() });
    if (!res.ok) throw new Error('일정 조회 실패');
    return res.json();
  },

  // 일정 등록
  createSchedule: async (data: {
    scheduleName: string;
    startDate: string;
    endDate: string;
    alarm?: number;
    alarmEnabled?: boolean;
  }): Promise<{ success: boolean; data: ScheduleResponse }> => {
    const res = await fetch(`${BASE}/api/calendar`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('일정 등록 실패');
    return res.json();
  },

  // 일정 수정
  updateSchedule: async (id: string, data: {
    scheduleName?: string;
    startDate?: string;
    endDate?: string;
    alarm?: number;
    alarmEnabled?: boolean;
  }): Promise<{ success: boolean; data: ScheduleResponse }> => {
    const res = await fetch(`${BASE}/api/calendar/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('일정 수정 실패');
    return res.json();
  },

  // 일정 삭제
  deleteSchedule: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`${BASE}/api/calendar/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('일정 삭제 실패');
    return res.json();
  },
};