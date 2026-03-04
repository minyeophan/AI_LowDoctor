import { Link } from 'react-router-dom';
import { mockDashboardStats } from '../../../mock/mockStats';
import '../myhome/MyHome.css';
import { FaBoxArchive } from "react-icons/fa6";
import { FaPen } from "react-icons/fa";
import { FaCalendarCheck } from "react-icons/fa";
import { BsPeopleFill } from "react-icons/bs";
export default function Dashboard() {
  const stats = mockDashboardStats;

  return (
    <div className="dashboard">
      {/* 헤더 */}
      <header className="dashboard-header">
        <h1>홈</h1>
      </header>

      {/* 내 활동 기록 섹션 */}
      <section className="activity-section">
        <h2 className="my-section-title">내 활동 기록</h2>

        <div className="activity-grid">
          {/* 보관 중 계약서 */}
          <div className="activity-card">
            <div className="card-icon-wrapper">
              <span className="card-icon"><FaBoxArchive /></span>
            </div>
            <h3 className="card-title">보관 중 계약서</h3>
            <p className="card-count">{stats.documentCount}건</p>
          </div>

          {/* 작성 중 계약서 */}
          <div className="activity-card">
            <div className="card-icon-wrapper">
              <span className="card-icon"><FaPen /></span>
            </div>
            <h3 className="card-title">작성 중 계약서</h3>
            <p className="card-count">{stats.draftCount}건</p>
          </div>

          {/* 다가오는 일정 */}
          <div className="activity-card">
            <div className="card-icon-wrapper">
              <span className="card-icon"><FaCalendarCheck /></span>
            </div>
            <h3 className="card-title">다가오는 일정</h3>
            <p className="card-count">{stats.scheduleCount}건</p>
          </div>

          {/* 커뮤니티 참여 */}
          <div className="activity-card">
            <div className="card-icon-wrapper">
              <span className="card-icon"><BsPeopleFill /></span>
            </div>
            <h3 className="card-title">커뮤니티 참여</h3>
            <p className="card-count">{stats.activityCount}건</p>
          </div>
        </div>
      </section>

      {/* 분석결과 - 그래프 섹션 */}
     <section className="analysis-section">
        <div className="analysis-grid">
          {/* 왼쪽 카드 - 회색 */}
          <div className="analysis-card gray">
            
          </div>

          {/* 오른쪽 카드 - 파란색 */}
          <div className="analysis-card blue">
            
          </div>
        </div>
      </section>
    </div>
  );
}