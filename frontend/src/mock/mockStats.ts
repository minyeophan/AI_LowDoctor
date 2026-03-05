// src/data/mock/mockStats.ts

export interface DashboardStats {
  documentCount: number;      // 보관 중 계약서
  draftCount: number;         // 작성 중 계약서
  scheduleCount: number;      // 다가오는 일정
  activityCount: number;      // 커뮤니티 참여
}

export const mockDashboardStats: DashboardStats = {
  documentCount: 3,
  draftCount: 2,
  scheduleCount: 1,
  activityCount: 5,
};